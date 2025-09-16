"""Production-ready error handling, retry logic, and circuit breakers."""

import asyncio
import time
import random
from typing import Dict, Any, List, Optional, Callable, Type, Union
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import functools
import logging
from contextlib import asynccontextmanager
import threading
from collections import deque

from trading.config import settings
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.resilience")


class CircuitState(Enum):
    """Circuit breaker state enumeration."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class RetryStrategy(Enum):
    """Retry strategy enumeration."""
    FIXED = "fixed"
    EXPONENTIAL = "exponential"
    LINEAR = "linear"
    RANDOM = "random"


@dataclass
class RetryConfig:
    """Retry configuration."""
    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL
    jitter: bool = True
    backoff_multiplier: float = 2.0


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration."""
    failure_threshold: int = 5
    recovery_timeout: float = 60.0
    success_threshold: int = 3
    timeout: float = 30.0


@dataclass
class CircuitBreakerStats:
    """Circuit breaker statistics."""
    state: CircuitState
    failure_count: int
    success_count: int
    last_failure_time: Optional[datetime]
    last_success_time: Optional[datetime]
    total_requests: int
    total_failures: int
    total_successes: int


class RetryManager:
    """Production-ready retry manager."""

    def __init__(self, config: RetryConfig):
        self.config = config

    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for retry attempt."""
        if attempt <= 0:
            return 0.0

        if self.config.strategy == RetryStrategy.FIXED:
            delay = self.config.base_delay
        elif self.config.strategy == RetryStrategy.EXPONENTIAL:
            delay = self.config.base_delay * \
                (self.config.backoff_multiplier ** (attempt - 1))
        elif self.config.strategy == RetryStrategy.LINEAR:
            delay = self.config.base_delay * attempt
        elif self.config.strategy == RetryStrategy.RANDOM:
            delay = random.uniform(
                self.config.base_delay,
                self.config.base_delay * attempt)
        else:
            delay = self.config.base_delay

        # Apply jitter
        if self.config.jitter:
            jitter_factor = random.uniform(0.5, 1.5)
            delay *= jitter_factor

        # Cap at max delay
        return min(delay, self.config.max_delay)

    async def execute_with_retry(
        self,
        func: Callable,
        *args,
        exceptions: Optional[List[Type[Exception]]] = None,
        **kwargs
    ) -> Any:
        """Execute function with retry logic."""
        if exceptions is None:
            exceptions = [Exception]

        last_exception = None

        for attempt in range(1, self.config.max_attempts + 1):
            try:
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)

                if attempt > 1:
                    trade_logger.logger.info(
                        f"Function succeeded on attempt {attempt}",
                        extra={"function": func.__name__, "attempt": attempt}
                    )

                return result

            except tuple(exceptions) as e:
                last_exception = e

                trade_logger.logger.warning(
                    f"Function failed on attempt {attempt}",
                    extra={
                        "function": func.__name__,
                        "attempt": attempt,
                        "max_attempts": self.config.max_attempts,
                        "error": str(e)
                    }
                )

                # Don't retry on last attempt
                if attempt == self.config.max_attempts:
                    break

                # Calculate delay and wait
                delay = self.calculate_delay(attempt)
                await asyncio.sleep(delay)

        # All attempts failed
        trade_logger.logger.error(
            f"Function failed after {self.config.max_attempts} attempts",
            extra={
                "function": func.__name__,
                "max_attempts": self.config.max_attempts,
                "final_error": str(last_exception)
            }
        )

        raise last_exception


class CircuitBreaker:
    """Production-ready circuit breaker."""

    def __init__(self, name: str, config: CircuitBreakerConfig):
        self.name = name
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.last_success_time = None
        self.total_requests = 0
        self.total_failures = 0
        self.total_successes = 0
        self._lock = threading.Lock()

        trade_logger.logger.info(
            f"Initialized circuit breaker: {name}",
            extra={
                "failure_threshold": config.failure_threshold,
                "recovery_timeout": config.recovery_timeout
            }
        )

    def get_stats(self) -> CircuitBreakerStats:
        """Get circuit breaker statistics."""
        with self._lock:
            return CircuitBreakerStats(
                state=self.state,
                failure_count=self.failure_count,
                success_count=self.success_count,
                last_failure_time=self.last_failure_time,
                last_success_time=self.last_success_time,
                total_requests=self.total_requests,
                total_failures=self.total_failures,
                total_successes=self.total_successes
            )

    def _should_attempt_reset(self) -> bool:
        """Check if circuit breaker should attempt reset."""
        if self.state != CircuitState.OPEN:
            return False

        if self.last_failure_time is None:
            return True

        time_since_failure = (
            datetime.now(
                timezone.utc) -
            self.last_failure_time).total_seconds()
        return time_since_failure >= self.config.recovery_timeout

    def _record_success(self) -> None:
        """Record successful operation."""
        with self._lock:
            self.total_requests += 1
            self.total_successes += 1
            self.last_success_time = datetime.now(timezone.utc)

            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.config.success_threshold:
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
                    self.success_count = 0

                    trade_logger.logger.info(
                        f"Circuit breaker {
                            self.name} closed after successful operations")
            else:
                self.failure_count = 0

    def _record_failure(self) -> None:
        """Record failed operation."""
        with self._lock:
            self.total_requests += 1
            self.total_failures += 1
            self.last_failure_time = datetime.now(timezone.utc)

            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                self.success_count = 0

                trade_logger.logger.warning(
                    f"Circuit breaker {
                        self.name} opened due to failure in half-open state")
            else:
                self.failure_count += 1
                if self.failure_count >= self.config.failure_threshold:
                    self.state = CircuitState.OPEN

                    trade_logger.logger.warning(
                        f"Circuit breaker {
                            self.name} opened due to failure threshold",
                        extra={
                            "failure_count": self.failure_count,
                            "failure_threshold": self.config.failure_threshold})

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Call function through circuit breaker."""
        # Check if circuit is open
        if self.state == CircuitState.OPEN:
            if not self._should_attempt_reset():
                raise CircuitBreakerOpenException(
                    f"Circuit breaker {self.name} is open")

            # Attempt reset
            self.state = CircuitState.HALF_OPEN
            self.success_count = 0

            trade_logger.logger.info(
                f"Circuit breaker {
                    self.name} attempting reset")

        # Execute function
        try:
            if asyncio.iscoroutinefunction(func):
                result = await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=self.config.timeout
                )
            else:
                result = func(*args, **kwargs)

            self._record_success()
            return result

        except asyncio.TimeoutError:
            self._record_failure()
            raise CircuitBreakerTimeoutException(
                f"Circuit breaker {self.name} timeout")
        except Exception as e:
            self._record_failure()
            raise CircuitBreakerException(
                f"Circuit breaker {
                    self.name} failure: {
                    str(e)}")


class CircuitBreakerException(Exception):
    """Circuit breaker exception."""
    pass


class CircuitBreakerOpenException(CircuitBreakerException):
    """Circuit breaker open exception."""
    pass


class CircuitBreakerTimeoutException(CircuitBreakerException):
    """Circuit breaker timeout exception."""
    pass


class RateLimiter:
    """Production-ready rate limiter."""

    def __init__(self, max_requests: int, time_window: float):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
        self._lock = threading.Lock()

        trade_logger.logger.info(
            f"Initialized rate limiter",
            extra={
                "max_requests": max_requests,
                "time_window": time_window
            }
        )

    async def acquire(self) -> bool:
        """Acquire rate limit permit."""
        with self._lock:
            now = time.time()

            # Remove old requests
            while self.requests and self.requests[0] <= now - self.time_window:
                self.requests.popleft()

            # Check if we can make a request
            if len(self.requests) < self.max_requests:
                self.requests.append(now)
                return True

            return False

    async def wait_for_permit(self) -> None:
        """Wait for rate limit permit."""
        while not await self.acquire():
            await asyncio.sleep(0.1)


class Bulkhead:
    """Production-ready bulkhead pattern."""

    def __init__(self, name: str, max_concurrent: int):
        self.name = name
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.active_operations = 0
        self._lock = threading.Lock()

        trade_logger.logger.info(
            f"Initialized bulkhead: {name}",
            extra={"max_concurrent": max_concurrent}
        )

    @asynccontextmanager
    async def acquire(self):
        """Acquire bulkhead permit."""
        await self.semaphore.acquire()

        with self._lock:
            self.active_operations += 1

        try:
            yield
        finally:
            with self._lock:
                self.active_operations -= 1
            self.semaphore.release()

    def get_stats(self) -> Dict[str, Any]:
        """Get bulkhead statistics."""
        with self._lock:
            return {
                "name": self.name,
                "max_concurrent": self.max_concurrent,
                "active_operations": self.active_operations,
                "available_permits": self.semaphore._value
            }


class TimeoutManager:
    """Production-ready timeout manager."""

    def __init__(self, default_timeout: float = 30.0):
        self.default_timeout = default_timeout

        trade_logger.logger.info(
            f"Initialized timeout manager with default timeout: {default_timeout}")

    async def execute_with_timeout(
        self,
        func: Callable,
        timeout: Optional[float] = None,
        *args,
        **kwargs
    ) -> Any:
        """Execute function with timeout."""
        timeout = timeout or self.default_timeout

        try:
            if asyncio.iscoroutinefunction(func):
                result = await asyncio.wait_for(func(*args, **kwargs), timeout=timeout)
            else:
                # Run sync function in thread pool
                loop = asyncio.get_event_loop()
                result = await asyncio.wait_for(
                    loop.run_in_executor(None, func, *args, **kwargs),
                    timeout=timeout
                )

            return result

        except asyncio.TimeoutError:
            trade_logger.logger.error(
                f"Function timed out after {timeout} seconds",
                extra={"function": func.__name__, "timeout": timeout}
            )
            raise TimeoutException(
                f"Function {
                    func.__name__} timed out after {timeout} seconds")


class TimeoutException(Exception):
    """Timeout exception."""
    pass


class ResilienceManager:
    """Production-ready resilience manager."""

    def __init__(self):
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.rate_limiters: Dict[str, RateLimiter] = {}
        self.bulkheads: Dict[str, Bulkhead] = {}
        self.timeout_manager = TimeoutManager()

        trade_logger.logger.info("Initialized resilience manager")

    def create_circuit_breaker(
        self,
        name: str,
        config: CircuitBreakerConfig
    ) -> CircuitBreaker:
        """Create circuit breaker."""
        circuit_breaker = CircuitBreaker(name, config)
        self.circuit_breakers[name] = circuit_breaker
        return circuit_breaker

    def create_rate_limiter(
        self,
        name: str,
        max_requests: int,
        time_window: float
    ) -> RateLimiter:
        """Create rate limiter."""
        rate_limiter = RateLimiter(max_requests, time_window)
        self.rate_limiters[name] = rate_limiter
        return rate_limiter

    def create_bulkhead(
        self,
        name: str,
        max_concurrent: int
    ) -> Bulkhead:
        """Create bulkhead."""
        bulkhead = Bulkhead(name, max_concurrent)
        self.bulkheads[name] = bulkhead
        return bulkhead

    def get_circuit_breaker(self, name: str) -> Optional[CircuitBreaker]:
        """Get circuit breaker by name."""
        return self.circuit_breakers.get(name)

    def get_rate_limiter(self, name: str) -> Optional[RateLimiter]:
        """Get rate limiter by name."""
        return self.rate_limiters.get(name)

    def get_bulkhead(self, name: str) -> Optional[Bulkhead]:
        """Get bulkhead by name."""
        return self.bulkheads.get(name)

    async def execute_with_resilience(
        self,
        func: Callable,
        circuit_breaker_name: Optional[str] = None,
        rate_limiter_name: Optional[str] = None,
        bulkhead_name: Optional[str] = None,
        timeout: Optional[float] = None,
        retry_config: Optional[RetryConfig] = None,
        *args,
        **kwargs
    ) -> Any:
        """Execute function with all resilience patterns."""
        try:
            # Apply rate limiting
            if rate_limiter_name:
                rate_limiter = self.get_rate_limiter(rate_limiter_name)
                if rate_limiter:
                    await rate_limiter.wait_for_permit()

            # Apply bulkhead
            if bulkhead_name:
                bulkhead = self.get_bulkhead(bulkhead_name)
                if bulkhead:
                    async with bulkhead.acquire():
                        return await self._execute_with_circuit_breaker_and_retry(
                            func, circuit_breaker_name, timeout, retry_config, *args, **kwargs
                        )
                else:
                    return await self._execute_with_circuit_breaker_and_retry(
                        func, circuit_breaker_name, timeout, retry_config, *args, **kwargs
                    )
            else:
                return await self._execute_with_circuit_breaker_and_retry(
                    func, circuit_breaker_name, timeout, retry_config, *args, **kwargs
                )

        except Exception as e:
            trade_logger.logger.error(f"Resilience execution failed: {e}")
            raise

    async def _execute_with_circuit_breaker_and_retry(
        self,
        func: Callable,
        circuit_breaker_name: Optional[str],
        timeout: Optional[float],
        retry_config: Optional[RetryConfig],
        *args,
        **kwargs
    ) -> Any:
        """Execute function with circuit breaker and retry."""
        # Apply circuit breaker
        if circuit_breaker_name:
            circuit_breaker = self.get_circuit_breaker(circuit_breaker_name)
            if circuit_breaker:
                return await circuit_breaker.call(func, *args, **kwargs)

        # Apply timeout and retry
        if retry_config:
            retry_manager = RetryManager(retry_config)
            return await retry_manager.execute_with_retry(
                self.timeout_manager.execute_with_timeout,
                func, timeout, *args, **kwargs
            )
        else:
            return await self.timeout_manager.execute_with_timeout(func, timeout, *args, **kwargs)

    def get_statistics(self) -> Dict[str, Any]:
        """Get resilience statistics."""
        stats = {
            "circuit_breakers": {},
            "rate_limiters": {},
            "bulkheads": {}
        }

        # Circuit breaker stats
        for name, cb in self.circuit_breakers.items():
            stats["circuit_breakers"][name] = cb.get_stats()

        # Rate limiter stats
        for name, rl in self.rate_limiters.items():
            stats["rate_limiters"][name] = {
                "max_requests": rl.max_requests,
                "time_window": rl.time_window,
                "current_requests": len(rl.requests)
            }

        # Bulkhead stats
        for name, bh in self.bulkheads.items():
            stats["bulkheads"][name] = bh.get_stats()

        return stats


# Decorators for easy resilience pattern application
def with_retry(config: RetryConfig,
               exceptions: Optional[List[Type[Exception]]] = None):
    """Decorator for retry logic."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            retry_manager = RetryManager(config)
            return await retry_manager.execute_with_retry(func, *args, exceptions=exceptions, **kwargs)
        return wrapper
    return decorator


def with_circuit_breaker(circuit_breaker_name: str):
    """Decorator for circuit breaker."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # This would need access to the resilience manager instance
            # In practice, you'd inject this or use a global instance
            raise NotImplementedError(
                "Circuit breaker decorator requires resilience manager instance")
        return wrapper
    return decorator


def with_timeout(timeout: float):
    """Decorator for timeout."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            timeout_manager = TimeoutManager()
            return await timeout_manager.execute_with_timeout(func, timeout, *args, **kwargs)
        return wrapper
    return decorator


def with_rate_limit(rate_limiter_name: str):
    """Decorator for rate limiting."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # This would need access to the resilience manager instance
            # In practice, you'd inject this or use a global instance
            raise NotImplementedError(
                "Rate limiter decorator requires resilience manager instance")
        return wrapper
    return decorator
