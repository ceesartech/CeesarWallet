"""Logging utilities for the trading ML algorithm."""

import logging
import sys
from typing import Any, Dict, Optional
import structlog
from rich.console import Console
from rich.logging import RichHandler
from trading.config import settings


def setup_logging() -> None:
    """Set up structured logging."""

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if settings.log_format == "json"
            else structlog.dev.ConsoleRenderer(colors=True),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure standard logging
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(message)s",
        stream=sys.stdout,
        handlers=[
            RichHandler(
                console=Console(stderr=True),
                show_time=True,
                show_path=True,
                enable_link_path=True,
            ) if settings.log_format != "json" else logging.StreamHandler()
        ],
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class TradingLogger:
    """Specialized logger for trading operations."""

    def __init__(self, name: str):
        self.logger = get_logger(name)

    def log_trade_signal(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        confidence: float,
        model_name: str,
        **kwargs: Any
    ) -> None:
        """Log a trade signal."""
        self.logger.info(
            "Trade signal generated",
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            confidence=confidence,
            model_name=model_name,
            **kwargs
        )

    def log_model_prediction(
        self,
        symbol: str,
        prediction: float,
        confidence: float,
        model_name: str,
        horizon: int,
        **kwargs: Any
    ) -> None:
        """Log a model prediction."""
        self.logger.info(
            "Model prediction",
            symbol=symbol,
            prediction=prediction,
            confidence=confidence,
            model_name=model_name,
            horizon=horizon,
            **kwargs
        )

    def log_training_metrics(
        self,
        model_name: str,
        epoch: int,
        train_loss: float,
        val_loss: float,
        metrics: Dict[str, float],
        **kwargs: Any
    ) -> None:
        """Log training metrics."""
        self.logger.info(
            "Training metrics",
            model_name=model_name,
            epoch=epoch,
            train_loss=train_loss,
            val_loss=val_loss,
            metrics=metrics,
            **kwargs
        )

    def log_risk_event(
        self,
        event_type: str,
        symbol: str,
        current_position: float,
        risk_metric: float,
        threshold: float,
        **kwargs: Any
    ) -> None:
        """Log a risk management event."""
        self.logger.warning(
            "Risk management event",
            event_type=event_type,
            symbol=symbol,
            current_position=current_position,
            risk_metric=risk_metric,
            threshold=threshold,
            **kwargs
        )

    def log_error(
        self,
        error_type: str,
        message: str,
        symbol: Optional[str] = None,
        **kwargs: Any
    ) -> None:
        """Log an error."""
        self.logger.error(
            "Error occurred",
            error_type=error_type,
            message=message,
            symbol=symbol,
            **kwargs
        )

    def log_performance_metrics(
        self,
        symbol: str,
        total_return: float,
        sharpe_ratio: float,
        max_drawdown: float,
        win_rate: float,
        **kwargs: Any
    ) -> None:
        """Log performance metrics."""
        self.logger.info(
            "Performance metrics",
            symbol=symbol,
            total_return=total_return,
            sharpe_ratio=sharpe_ratio,
            max_drawdown=max_drawdown,
            win_rate=win_rate,
            **kwargs
        )


# Global logger instances
main_logger = get_logger("trading.main")
model_logger = TradingLogger("trading.models")
trade_logger = TradingLogger("trading.execution")
risk_logger = TradingLogger("trading.risk")
data_logger = TradingLogger("trading.data")
