"""Production-ready Alpaca broker adapter implementation."""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone, timedelta
import base64
import hmac
import hashlib
from decimal import Decimal
import backoff
from dataclasses import dataclass
from enum import Enum

from .base import BaseBrokerAdapter
from trading.schemas import TradeSignal, TradeExecution, Position, Side, OrderType, ExecutionStatus
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.execution")


class AlpacaOrderStatus(Enum):
    """Alpaca order status enumeration."""
    NEW = "new"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    DONE_FOR_DAY = "done_for_day"
    CANCELED = "canceled"
    EXPIRED = "expired"
    REPLACED = "replaced"
    PENDING_CANCEL = "pending_cancel"
    PENDING_REPLACE = "pending_replace"
    ACCEPTED = "accepted"
    PENDING_NEW = "pending_new"
    ACCEPTED_FOR_BIDDING = "accepted_for_bidding"
    STOPPED = "stopped"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    CALCULATED = "calculated"


class AlpacaOrderType(Enum):
    """Alpaca order type enumeration."""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"


class AlpacaTimeInForce(Enum):
    """Alpaca time in force enumeration."""
    DAY = "day"
    GTC = "gtc"
    OPG = "opg"
    CLS = "cls"
    IOC = "ioc"
    FOK = "fok"


@dataclass
class AlpacaOrderRequest:
    """Alpaca order request data class."""
    symbol: str
    qty: Optional[str] = None
    notional: Optional[str] = None
    side: str = "buy"
    type: str = "market"
    time_in_force: str = "day"
    limit_price: Optional[str] = None
    stop_price: Optional[str] = None
    trail_price: Optional[str] = None
    trail_percent: Optional[str] = None
    extended_hours: bool = False
    client_order_id: Optional[str] = None
    order_class: Optional[str] = None
    take_profit: Optional[Dict[str, str]] = None
    stop_loss: Optional[Dict[str, str]] = None


@dataclass
class AlpacaAccountInfo:
    """Alpaca account information data class."""
    account_id: str
    account_number: str
    status: str
    currency: str
    buying_power: Decimal
    regt_buying_power: Decimal
    daytrading_buying_power: Decimal
    cash: Decimal
    portfolio_value: Decimal
    pattern_day_trader: bool
    trading_blocked: bool
    transfers_blocked: bool
    account_blocked: bool
    created_at: datetime
    trade_suspended_by_user: bool
    multiplier: str
    shorting_enabled: bool
    equity: Decimal
    last_equity: Decimal
    long_market_value: Decimal
    short_market_value: Decimal
    initial_margin: Decimal
    maintenance_margin: Decimal
    last_maintenance_margin: Decimal
    sma: Decimal
    daytrade_count: int


class AlpacaAdapter(BaseBrokerAdapter):
    """Production-ready Alpaca broker adapter with comprehensive error handling and rate limiting."""
    
    def __init__(self, api_key: str, secret_key: str, sandbox: bool = True):
        super().__init__(api_key, secret_key, sandbox)
        
        # API endpoints
        self.base_url = "https://paper-api.alpaca.markets" if sandbox else "https://api.alpaca.markets"
        self.data_url = "https://data.alpaca.markets"
        self.stream_url = "wss://stream.data.alpaca.markets/v2/iex" if sandbox else "wss://stream.data.alpaca.markets/v2/iex"
        
        # Session management
        self.session: Optional[aiohttp.ClientSession] = None
        self.websocket: Optional[aiohttp.ClientWebSocketResponse] = None
        
        # Rate limiting
        self.rate_limiter = asyncio.Semaphore(200)  # 200 requests per minute
        self.last_request_time = 0
        self.min_request_interval = 0.3  # 300ms between requests
        
        # Connection state
        self.is_connected = False
        self.connection_retry_count = 0
        self.max_retry_attempts = 5
        self.retry_delay = 1.0
        
        # Account info cache
        self._account_info_cache: Optional[AlpacaAccountInfo] = None
        self._account_info_cache_time: Optional[datetime] = None
        self._account_info_cache_ttl = timedelta(minutes=1)
        
        # Market data cache
        self._market_data_cache: Dict[str, Dict[str, Any]] = {}
        self._market_data_cache_ttl = timedelta(seconds=5)
        
        # Order tracking
        self._pending_orders: Dict[str, TradeExecution] = {}
        self._order_status_cache: Dict[str, Dict[str, Any]] = {}
        
        # Error tracking
        self._error_count = 0
        self._last_error_time: Optional[datetime] = None
        self._circuit_breaker_threshold = 10
        self._circuit_breaker_timeout = timedelta(minutes=5)
        self._circuit_breaker_active = False
    
    async def connect(self) -> bool:
        """Connect to Alpaca API with comprehensive error handling and retry logic."""
        if self._circuit_breaker_active:
            if self._last_error_time and datetime.now(timezone.utc) - self._last_error_time < self._circuit_breaker_timeout:
                trade_logger.logger.warning("Circuit breaker active, connection blocked")
                return False
            else:
                self._circuit_breaker_active = False
                self._error_count = 0
        
        for attempt in range(self.max_retry_attempts):
            try:
                # Create session with proper configuration
                timeout = aiohttp.ClientTimeout(total=30, connect=10)
                connector = aiohttp.TCPConnector(
                    limit=100,
                    limit_per_host=30,
                    keepalive_timeout=30,
                    enable_cleanup_closed=True
                )
                
                self.session = aiohttp.ClientSession(
                    timeout=timeout,
                    connector=connector,
                    headers=self._get_default_headers()
                )
                
                # Test connection with account info
                account_info = await self._make_request("GET", "/v2/account")
                
                if account_info:
                    self.is_connected = True
                    self.connection_retry_count = 0
                    self._error_count = 0
                    
                    # Cache account info
                    self._account_info_cache = self._parse_account_info(account_info)
                    self._account_info_cache_time = datetime.now(timezone.utc)
                    
                    trade_logger.logger.info(
                        "Successfully connected to Alpaca API",
                        extra={
                            "sandbox": self.sandbox,
                            "account_id": self._account_info_cache.account_id,
                            "status": self._account_info_cache.status
                        }
                    )
                    return True
                else:
                    raise Exception("Failed to retrieve account information")
                    
            except Exception as e:
                self.connection_retry_count += 1
                self._error_count += 1
                
                trade_logger.logger.error(
                    f"Connection attempt {attempt + 1} failed",
                    extra={"error": str(e), "attempt": attempt + 1}
                )
                
                if attempt < self.max_retry_attempts - 1:
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    self._handle_connection_failure(e)
                    return False
        
        return False
    
    async def disconnect(self) -> bool:
        """Disconnect from Alpaca API and cleanup resources."""
        try:
            # Close WebSocket connection
            if self.websocket and not self.websocket.closed:
                await self.websocket.close()
                self.websocket = None
            
            # Close HTTP session
            if self.session and not self.session.closed:
                await self.session.close()
                self.session = None
            
            self.is_connected = False
            
            # Clear caches
            self._account_info_cache = None
            self._market_data_cache.clear()
            self._order_status_cache.clear()
            
            trade_logger.logger.info("Disconnected from Alpaca API")
            return True
            
        except Exception as e:
            trade_logger.logger.error(f"Error during disconnect: {e}")
            return False
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        retries: int = 3
    ) -> Optional[Dict[str, Any]]:
        """Make HTTP request with rate limiting, retry logic, and error handling."""
        if not self.session:
            raise Exception("Not connected to Alpaca API")
        
        # Rate limiting
        await self.rate_limiter.acquire()
        try:
            # Ensure minimum interval between requests
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            if time_since_last < self.min_request_interval:
                await asyncio.sleep(self.min_request_interval - time_since_last)
            
            self.last_request_time = time.time()
            
            # Make request with retry logic
            for attempt in range(retries):
                try:
                    url = f"{self.base_url}{endpoint}"
                    
                    async with self.session.request(
                        method=method,
                        url=url,
                        json=data,
                        params=params
                    ) as response:
                        
                        # Handle rate limiting
                        if response.status == 429:
                            retry_after = int(response.headers.get('Retry-After', 60))
                            trade_logger.logger.warning(f"Rate limited, waiting {retry_after} seconds")
                            await asyncio.sleep(retry_after)
                            continue
                        
                        # Handle server errors
                        if response.status >= 500:
                            if attempt < retries - 1:
                                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                                continue
                            else:
                                raise Exception(f"Server error: {response.status}")
                        
                        # Handle client errors
                        if response.status >= 400:
                            error_text = await response.text()
                            error_data = {}
                            try:
                                error_data = await response.json()
                            except:
                                pass
                            
                            raise Exception(f"Client error {response.status}: {error_text}")
                        
                        # Success
                        if response.status in [200, 201, 204]:
                            if response.status == 204:
                                return {}
                            
                            response_data = await response.json()
                            return response_data
                        
                        # Unexpected status
                        raise Exception(f"Unexpected status code: {response.status}")
                        
                except aiohttp.ClientError as e:
                    if attempt < retries - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    else:
                        raise Exception(f"Network error: {e}")
            
            return None
            
        finally:
            self.rate_limiter.release()
    
    def _get_default_headers(self) -> Dict[str, str]:
        """Get default HTTP headers."""
        return {
            "APCA-API-KEY-ID": self.api_key,
            "APCA-API-SECRET-KEY": self.secret_key,
            "Content-Type": "application/json",
            "User-Agent": "CeesarWallet/1.0.0"
        }
    
    def _parse_account_info(self, data: Dict[str, Any]) -> AlpacaAccountInfo:
        """Parse account information from API response."""
        return AlpacaAccountInfo(
            account_id=data["id"],
            account_number=data["account_number"],
            status=data["status"],
            currency=data["currency"],
            buying_power=Decimal(str(data["buying_power"])),
            regt_buying_power=Decimal(str(data["regt_buying_power"])),
            daytrading_buying_power=Decimal(str(data["daytrading_buying_power"])),
            cash=Decimal(str(data["cash"])),
            portfolio_value=Decimal(str(data["portfolio_value"])),
            pattern_day_trader=data["pattern_day_trader"],
            trading_blocked=data["trading_blocked"],
            transfers_blocked=data["transfers_blocked"],
            account_blocked=data["account_blocked"],
            created_at=datetime.fromisoformat(data["created_at"].replace('Z', '+00:00')),
            trade_suspended_by_user=data["trade_suspended_by_user"],
            multiplier=data["multiplier"],
            shorting_enabled=data["shorting_enabled"],
            equity=Decimal(str(data["equity"])),
            last_equity=Decimal(str(data["last_equity"])),
            long_market_value=Decimal(str(data["long_market_value"])),
            short_market_value=Decimal(str(data["short_market_value"])),
            initial_margin=Decimal(str(data["initial_margin"])),
            maintenance_margin=Decimal(str(data["maintenance_margin"])),
            last_maintenance_margin=Decimal(str(data["last_maintenance_margin"])),
            sma=Decimal(str(data["sma"])),
            daytrade_count=data["daytrade_count"]
        )
    
    def _handle_connection_failure(self, error: Exception):
        """Handle connection failure and activate circuit breaker if necessary."""
        self._last_error_time = datetime.now(timezone.utc)
        
        if self._error_count >= self._circuit_breaker_threshold:
            self._circuit_breaker_active = True
            trade_logger.logger.error(
                "Circuit breaker activated due to repeated connection failures",
                extra={"error_count": self._error_count, "error": str(error)}
            )
        
        self.is_connected = False
    
    async def place_order(self, signal: TradeSignal) -> TradeExecution:
        """Place an order with Alpaca with comprehensive validation and error handling."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            # Validate signal
            if not self.validate_signal(signal):
                raise ValueError("Invalid trading signal")
            
            # Check account status
            account_info = await self.get_account_info()
            if account_info.trading_blocked or account_info.account_blocked:
                raise Exception("Trading is blocked for this account")
            
            # Validate order size against buying power
            if signal.side == Side.BUY:
                required_capital = signal.quantity * (signal.price or await self.get_current_price(signal.symbol))
                if required_capital > account_info.buying_power:
                    raise Exception(f"Insufficient buying power. Required: {required_capital}, Available: {account_info.buying_power}")
            
            # Create order request
            order_request = self._create_order_request(signal)
            
            # Place order
            order_response = await self._make_request(
                "POST",
                "/v2/orders",
                data=order_request.__dict__
            )
            
            if not order_response:
                raise Exception("Failed to place order")
            
            # Create execution object
            execution = self._create_execution_from_response(signal, order_response)
            
            # Track pending order
            self._pending_orders[execution.execution_id] = execution
            
            # Log order placement
            trade_logger.logger.info(
                "Order placed successfully",
                extra={
                    "order_id": execution.execution_id,
                    "symbol": signal.symbol,
                    "side": signal.side.value,
                    "quantity": signal.quantity,
                    "order_type": signal.order_type.value,
                    "price": signal.price
                }
            )
            
            return execution
            
        except Exception as e:
            trade_logger.logger.error(
                "Failed to place order",
                extra={
                    "symbol": signal.symbol,
                    "side": signal.side.value,
                    "quantity": signal.quantity,
                    "error": str(e)
                }
            )
            self.handle_broker_error(e)
            raise
    
    def _create_order_request(self, signal: TradeSignal) -> AlpacaOrderRequest:
        """Create Alpaca order request from trade signal."""
        order_request = AlpacaOrderRequest(
            symbol=signal.symbol,
            side=self._map_side(signal.side),
            type=self._map_order_type(signal.order_type),
            time_in_force=self._map_time_in_force(signal),
            client_order_id=f"ceesar_{int(time.time() * 1000)}"
        )
        
        # Set quantity or notional
        if signal.quantity:
            order_request.qty = str(signal.quantity)
        elif signal.price:
            order_request.notional = str(signal.quantity * signal.price)
        
        # Set price for limit orders
        if signal.order_type == OrderType.LIMIT and signal.price:
            order_request.limit_price = str(signal.price)
        
        # Set stop price for stop orders
        if signal.order_type in [OrderType.STOP, OrderType.STOP_LIMIT] and signal.stop_loss:
            order_request.stop_price = str(signal.stop_loss)
        
        # Set order class for bracket orders
        if signal.stop_loss or signal.take_profit:
            order_request.order_class = "bracket"
            
            if signal.stop_loss:
                order_request.stop_loss = {
                    "stop_price": str(signal.stop_loss)
                }
            
            if signal.take_profit:
                order_request.take_profit = {
                    "limit_price": str(signal.take_profit)
                }
        
        return order_request
    
    def _create_updated_signal(self, current_order: Dict[str, Any], updates: Dict[str, Any]) -> TradeSignal:
        """Create updated trade signal from current order and updates."""
        # Extract current order details
        symbol = current_order.get("symbol", "")
        side = Side.BUY if current_order.get("side") == "buy" else Side.SELL
        order_type = self._map_alpaca_order_type_to_enum(current_order.get("type", "market"))
        quantity = float(current_order.get("qty", 0))
        price = float(current_order.get("limit_price", 0)) if current_order.get("limit_price") else None
        
        # Apply updates
        if "quantity" in updates:
            quantity = float(updates["quantity"])
        if "price" in updates:
            price = float(updates["price"])
        if "order_type" in updates:
            order_type = updates["order_type"]
        if "side" in updates:
            side = updates["side"]
        
        # Create new signal
        signal = TradeSignal(
            symbol=symbol,
            side=side,
            quantity=quantity,
            order_type=order_type,
            price=price,
            timestamp=datetime.now(timezone.utc),
            metadata={
                "updated_from_order": current_order.get("id"),
                "update_reason": updates.get("reason", "manual_update")
            }
        )
        
        return signal
    
    def _map_alpaca_order_type_to_enum(self, alpaca_type: str) -> OrderType:
        """Map Alpaca order type string to OrderType enum."""
        mapping = {
            "market": OrderType.MARKET,
            "limit": OrderType.LIMIT,
            "stop": OrderType.STOP,
            "stop_limit": OrderType.STOP_LIMIT
        }
        return mapping.get(alpaca_type, OrderType.MARKET)
    
    def _create_execution_from_response(self, signal: TradeSignal, response: Dict[str, Any]) -> TradeExecution:
        """Create TradeExecution from Alpaca order response."""
        return TradeExecution(
            signal=signal,
            execution_id=response["id"],
            executed_price=float(response.get("filled_avg_price", 0)),
            executed_quantity=float(response.get("filled_qty", 0)),
            execution_time=datetime.now(timezone.utc),
            fees=float(response.get("commission", 0)),
            status=self._map_execution_status(response["status"]),
            broker_order_id=response["id"],
            metadata={
                "alpaca_status": response["status"],
                "submitted_at": response.get("submitted_at"),
                "created_at": response.get("created_at"),
                "updated_at": response.get("updated_at"),
                "legs": response.get("legs", []),
                "trail_price": response.get("trail_price"),
                "trail_percent": response.get("trail_percent")
            }
        )
    
    async def get_current_price(self, symbol: str) -> float:
        """Get current price for symbol with caching."""
        # Check cache first
        if symbol in self._market_data_cache:
            cache_time = self._market_data_cache[symbol].get("timestamp")
            if cache_time and datetime.now(timezone.utc) - cache_time < self._market_data_cache_ttl:
                return self._market_data_cache[symbol]["last"]
        
        # Fetch from API
        try:
            market_data = await self.get_market_data(symbol)
            price = market_data["last"]
            
            # Update cache
            self._market_data_cache[symbol] = {
                "last": price,
                "timestamp": datetime.now(timezone.utc)
            }
            
            return price
            
        except Exception as e:
            trade_logger.logger.error(f"Failed to get current price for {symbol}: {e}")
            raise
    
    async def update_order(self, order_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing order (Alpaca doesn't support direct updates, so we cancel and replace)."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            # Get current order details
            current_order = await self.get_order_status(order_id)
            if not current_order:
                raise Exception(f"Order {order_id} not found")
            
            # Cancel existing order
            await self.cancel_order(order_id)
            
            # Create new order with updated parameters
            new_signal = self._create_updated_signal(current_order, updates)
            new_execution = await self.place_order(new_signal)
            
            trade_logger.logger.info(
                f"Order {order_id} updated by cancellation and replacement",
                extra={
                    "original_order_id": order_id,
                    "new_order_id": new_execution.execution_id,
                    "updates": updates
                }
            )
            
            return {
                "message": "Order updated by cancellation and replacement",
                "original_order_id": order_id,
                "new_order_id": new_execution.execution_id,
                "new_execution": new_execution
            }
            
        except Exception as e:
            trade_logger.logger.error(f"Failed to update order {order_id}: {e}")
            self.handle_broker_error(e)
            raise
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order with comprehensive error handling."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            # Cancel order
            response = await self._make_request("DELETE", f"/v2/orders/{order_id}")
            
            if response is not None:
                # Remove from pending orders
                if order_id in self._pending_orders:
                    del self._pending_orders[order_id]
                
                # Remove from status cache
                if order_id in self._order_status_cache:
                    del self._order_status_cache[order_id]
                
                trade_logger.logger.info(f"Order {order_id} cancelled successfully")
                return True
            else:
                raise Exception("Failed to cancel order")
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to cancel order {order_id}: {e}")
            self.handle_broker_error(e)
            return False
    
    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status with caching."""
        try:
            # Check cache first
            if order_id in self._order_status_cache:
                cache_time = self._order_status_cache[order_id].get("cache_time")
                if cache_time and datetime.now(timezone.utc) - cache_time < timedelta(seconds=30):
                    return self._order_status_cache[order_id]["data"]
            
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            # Fetch from API
            order_data = await self._make_request("GET", f"/v2/orders/{order_id}")
            
            if order_data:
                # Update cache
                self._order_status_cache[order_id] = {
                    "data": order_data,
                    "cache_time": datetime.now(timezone.utc)
                }
                
                return order_data
            else:
                raise Exception("Order not found")
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get order status for {order_id}: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_positions(self) -> List[Position]:
        """Get current positions with comprehensive error handling."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            positions_data = await self._make_request("GET", "/v2/positions")
            
            if not positions_data:
                return []
            
            positions = []
            for pos_data in positions_data:
                try:
                    position = Position(
                        symbol=pos_data["symbol"],
                        quantity=float(pos_data["qty"]),
                        average_price=float(pos_data["avg_entry_price"]),
                        unrealized_pnl=float(pos_data["unrealized_pl"]),
                        realized_pnl=float(pos_data["realized_pl"]),
                        market_value=float(pos_data["market_value"]),
                        timestamp=datetime.now(timezone.utc),
                        metadata={
                            "cost_basis": pos_data.get("cost_basis"),
                            "unrealized_plpc": pos_data.get("unrealized_plpc"),
                            "unrealized_intraday_pl": pos_data.get("unrealized_intraday_pl"),
                            "unrealized_intraday_plpc": pos_data.get("unrealized_intraday_plpc"),
                            "current_price": pos_data.get("current_price"),
                            "lastday_price": pos_data.get("lastday_price"),
                            "change_today": pos_data.get("change_today")
                        }
                    )
                    positions.append(position)
                    
                except (KeyError, ValueError, TypeError) as e:
                    trade_logger.logger.warning(f"Failed to parse position data: {e}")
                    continue
            
            return positions
            
        except Exception as e:
            trade_logger.logger.error(f"Failed to get positions: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_account_info(self) -> AlpacaAccountInfo:
        """Get account information with caching."""
        try:
            # Check cache first
            if (self._account_info_cache and 
                self._account_info_cache_time and 
                datetime.now(timezone.utc) - self._account_info_cache_time < self._account_info_cache_ttl):
                return self._account_info_cache
            
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            # Fetch from API
            account_data = await self._make_request("GET", "/v2/account")
            
            if account_data:
                # Parse and cache account info
                self._account_info_cache = self._parse_account_info(account_data)
                self._account_info_cache_time = datetime.now(timezone.utc)
                
                return self._account_info_cache
            else:
                raise Exception("Failed to retrieve account information")
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get account info: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """Get market data for symbol with comprehensive error handling."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            # Get latest quote
            quote_data = await self._make_request("GET", f"/v2/stocks/{symbol}/quotes/latest")
            
            if not quote_data or "quote" not in quote_data:
                raise Exception(f"No quote data available for {symbol}")
            
            quote = quote_data["quote"]
            
            # Get latest trade
            trade_data = await self._make_request("GET", f"/v2/stocks/{symbol}/trades/latest")
            
            market_data = {
                "symbol": symbol,
                "bid": float(quote["bp"]) if quote["bp"] else None,
                "ask": float(quote["ap"]) if quote["ap"] else None,
                "bid_size": int(quote["bs"]) if quote["bs"] else None,
                "ask_size": int(quote["as"]) if quote["as"] else None,
                "timestamp": quote["t"],
                "exchange": quote.get("x", "IEX")
            }
            
            if trade_data and "trade" in trade_data:
                trade = trade_data["trade"]
                market_data.update({
                    "last": float(trade["p"]) if trade["p"] else None,
                    "volume": int(trade["s"]) if trade["s"] else None,
                    "trade_timestamp": trade["t"]
                })
            
            return market_data
            
        except Exception as e:
            trade_logger.logger.error(f"Failed to get market data for {symbol}: {e}")
            self.handle_broker_error(e)
            raise
    
    def _map_order_type(self, order_type: OrderType) -> str:
        """Map order type to Alpaca format."""
        mapping = {
            OrderType.MARKET: AlpacaOrderType.MARKET.value,
            OrderType.LIMIT: AlpacaOrderType.LIMIT.value,
            OrderType.STOP: AlpacaOrderType.STOP.value,
            OrderType.STOP_LIMIT: AlpacaOrderType.STOP_LIMIT.value
        }
        return mapping.get(order_type, AlpacaOrderType.MARKET.value)
    
    def _map_side(self, side: Side) -> str:
        """Map side to Alpaca format."""
        return side.value.lower()
    
    def _map_time_in_force(self, signal: TradeSignal) -> str:
        """Map time in force based on signal properties."""
        # Default to DAY for most orders
        return AlpacaTimeInForce.DAY.value
    
    def _map_execution_status(self, alpaca_status: str) -> ExecutionStatus:
        """Map Alpaca order status to ExecutionStatus."""
        status_mapping = {
            AlpacaOrderStatus.NEW.value: ExecutionStatus.PENDING,
            AlpacaOrderStatus.PARTIALLY_FILLED.value: ExecutionStatus.PARTIALLY_FILLED,
            AlpacaOrderStatus.FILLED.value: ExecutionStatus.FILLED,
            AlpacaOrderStatus.CANCELED.value: ExecutionStatus.CANCELLED,
            AlpacaOrderStatus.EXPIRED.value: ExecutionStatus.EXPIRED,
            AlpacaOrderStatus.REJECTED.value: ExecutionStatus.REJECTED,
            AlpacaOrderStatus.PENDING_CANCEL.value: ExecutionStatus.PENDING_CANCEL,
            AlpacaOrderStatus.PENDING_REPLACE.value: ExecutionStatus.PENDING_REPLACE,
            AlpacaOrderStatus.ACCEPTED.value: ExecutionStatus.ACCEPTED,
            AlpacaOrderStatus.PENDING_NEW.value: ExecutionStatus.PENDING,
            AlpacaOrderStatus.STOPPED.value: ExecutionStatus.STOPPED,
            AlpacaOrderStatus.SUSPENDED.value: ExecutionStatus.SUSPENDED
        }
        return status_mapping.get(alpaca_status, ExecutionStatus.UNKNOWN)
    
    async def get_historical_data(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        timeframe: str = "1Day",
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """Get historical data from Alpaca with comprehensive error handling."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            params = {
                "symbols": symbol,
                "start": start_date,
                "end": end_date,
                "timeframe": timeframe,
                "limit": limit,
                "asof": None,
                "feed": "iex",
                "sort": "asc"
            }
            
            bars_data = await self._make_request("GET", f"/v2/stocks/{symbol}/bars", params=params)
            
            if bars_data and "bars" in bars_data and symbol in bars_data["bars"]:
                bars = bars_data["bars"][symbol]
                
                # Convert to standardized format
                historical_data = []
                for bar in bars:
                    historical_data.append({
                        "timestamp": bar["t"],
                        "open": float(bar["o"]),
                        "high": float(bar["h"]),
                        "low": float(bar["l"]),
                        "close": float(bar["c"]),
                        "volume": int(bar["v"]),
                        "trade_count": bar.get("n", 0),
                        "vwap": float(bar.get("vw", 0))
                    })
                
                return historical_data
            else:
                return []
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get historical data for {symbol}: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_news(self, symbol: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get news for symbol with comprehensive error handling."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            params = {
                "symbols": symbol,
                "limit": limit,
                "include_content": True,
                "exclude_content": False
            }
            
            news_data = await self._make_request("GET", "/v1beta1/news", params=params)
            
            if news_data and "news" in news_data:
                return news_data["news"]
            else:
                return []
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get news for {symbol}: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_calendar(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get market calendar information."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            params = {
                "start": start_date,
                "end": end_date
            }
            
            calendar_data = await self._make_request("GET", "/v1/calendar", params=params)
            
            if calendar_data:
                return calendar_data
            else:
                return []
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get calendar: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_clock(self) -> Dict[str, Any]:
        """Get market clock information."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            clock_data = await self._make_request("GET", "/v2/clock")
            
            if clock_data:
                return {
                    "timestamp": clock_data["timestamp"],
                    "is_open": clock_data["is_open"],
                    "next_open": clock_data["next_open"],
                    "next_close": clock_data["next_close"]
                }
            else:
                raise Exception("Failed to get market clock")
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get market clock: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_assets(self, status: str = "active", asset_class: str = "us_equity") -> List[Dict[str, Any]]:
        """Get available assets."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            params = {
                "status": status,
                "asset_class": asset_class
            }
            
            assets_data = await self._make_request("GET", "/v2/assets", params=params)
            
            if assets_data:
                return assets_data
            else:
                return []
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get assets: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_asset(self, symbol: str) -> Dict[str, Any]:
        """Get specific asset information."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            asset_data = await self._make_request("GET", f"/v2/assets/{symbol}")
            
            if asset_data:
                return asset_data
            else:
                raise Exception(f"Asset {symbol} not found")
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get asset {symbol}: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_orders(
        self,
        status: Optional[str] = None,
        limit: int = 100,
        after: Optional[str] = None,
        until: Optional[str] = None,
        direction: str = "desc"
    ) -> List[Dict[str, Any]]:
        """Get orders with filtering."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            params = {
                "status": status,
                "limit": limit,
                "after": after,
                "until": until,
                "direction": direction
            }
            
            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}
            
            orders_data = await self._make_request("GET", "/v2/orders", params=params)
            
            if orders_data:
                return orders_data
            else:
                return []
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get orders: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_portfolio_history(
        self,
        period: str = "1M",
        timeframe: str = "1Day",
        extended_hours: bool = True
    ) -> Dict[str, Any]:
        """Get portfolio history."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            params = {
                "period": period,
                "timeframe": timeframe,
                "extended_hours": extended_hours
            }
            
            history_data = await self._make_request("GET", "/v2/account/portfolio/history", params=params)
            
            if history_data:
                return history_data
            else:
                raise Exception("Failed to get portfolio history")
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get portfolio history: {e}")
            self.handle_broker_error(e)
            raise
    
    async def get_activities(
        self,
        activity_type: Optional[str] = None,
        activity_types: Optional[List[str]] = None,
        date: Optional[str] = None,
        until: Optional[str] = None,
        after: Optional[str] = None,
        direction: str = "desc",
        page_size: int = 100
    ) -> List[Dict[str, Any]]:
        """Get account activities."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to Alpaca API")
            
            params = {
                "activity_type": activity_type,
                "activity_types": ",".join(activity_types) if activity_types else None,
                "date": date,
                "until": until,
                "after": after,
                "direction": direction,
                "page_size": page_size
            }
            
            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}
            
            activities_data = await self._make_request("GET", "/v2/account/activities", params=params)
            
            if activities_data:
                return activities_data
            else:
                return []
                
        except Exception as e:
            trade_logger.logger.error(f"Failed to get activities: {e}")
            self.handle_broker_error(e)
            raise
    
    def validate_signal(self, signal: TradeSignal) -> bool:
        """Validate trading signal before execution."""
        try:
            # Basic validation
            if not signal.symbol or not signal.symbol.strip():
                return False
            
            if signal.quantity <= 0:
                return False
            
            if signal.side not in [Side.BUY, Side.SELL]:
                return False
            
            if signal.order_type not in [OrderType.MARKET, OrderType.LIMIT, OrderType.STOP, OrderType.STOP_LIMIT]:
                return False
            
            # Price validation for limit orders
            if signal.order_type in [OrderType.LIMIT, OrderType.STOP_LIMIT] and not signal.price:
                return False
            
            if signal.price and signal.price <= 0:
                return False
            
            # Stop loss and take profit validation
            if signal.stop_loss and signal.stop_loss <= 0:
                return False
            
            if signal.take_profit and signal.take_profit <= 0:
                return False
            
            # Stop loss should be below current price for buy orders
            if signal.side == Side.BUY and signal.stop_loss and signal.price and signal.stop_loss >= signal.price:
                return False
            
            # Take profit should be above current price for buy orders
            if signal.side == Side.BUY and signal.take_profit and signal.price and signal.take_profit <= signal.price:
                return False
            
            return True
            
        except Exception as e:
            trade_logger.logger.error(f"Signal validation error: {e}")
            return False
    
    def handle_broker_error(self, error: Exception):
        """Handle broker-specific errors with comprehensive logging."""
        self._error_count += 1
        self._last_error_time = datetime.now(timezone.utc)
        
        # Log error with context
        trade_logger.logger.error(
            f"Broker error occurred",
            extra={
                "error_type": type(error).__name__,
                "error_message": str(error),
                "error_count": self._error_count,
                "broker": "Alpaca",
                "sandbox": self.sandbox
            }
        )
        
        # Activate circuit breaker if threshold exceeded
        if self._error_count >= self._circuit_breaker_threshold:
            self._circuit_breaker_active = True
            trade_logger.logger.critical(
                "Circuit breaker activated due to repeated errors",
                extra={
                    "error_count": self._error_count,
                    "broker": "Alpaca"
                }
            )
