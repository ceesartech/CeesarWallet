"""Base broker adapter interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from trading.schemas import TradeSignal, TradeExecution, Position
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.execution")


class BaseBrokerAdapter(ABC):
    """Base class for broker adapters."""
    
    def __init__(self, api_key: str, secret_key: str, sandbox: bool = True):
        self.api_key = api_key
        self.secret_key = secret_key
        self.sandbox = sandbox
        self.is_connected = False
    
    @abstractmethod
    async def connect(self) -> bool:
        """Connect to broker API."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from broker API."""
        pass
    
    @abstractmethod
    async def place_order(self, signal: TradeSignal) -> TradeExecution:
        """Place an order."""
        pass
    
    @abstractmethod
    async def update_order(self, order_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing order."""
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order."""
        pass
    
    @abstractmethod
    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status."""
        pass
    
    @abstractmethod
    async def get_positions(self) -> List[Position]:
        """Get current positions."""
        pass
    
    @abstractmethod
    async def get_account_info(self) -> Dict[str, Any]:
        """Get account information."""
        pass
    
    @abstractmethod
    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """Get market data for symbol."""
        pass
    
    def validate_signal(self, signal: TradeSignal) -> bool:
        """Validate trading signal."""
        try:
            if not signal.symbol:
                trade_logger.log_error("Invalid signal", "Symbol is required")
                return False
            
            if signal.quantity <= 0:
                trade_logger.log_error("Invalid signal", "Quantity must be positive")
                return False
            
            if signal.side not in [Side.BUY, Side.SELL, Side.HOLD]:
                trade_logger.log_error("Invalid signal", "Invalid side")
                return False
            
            if signal.order_type == OrderType.LIMIT and not signal.price:
                trade_logger.log_error("Invalid signal", "Price required for limit orders")
                return False
            
            return True
            
        except Exception as e:
            trade_logger.log_error("Signal validation error", str(e))
            return False
    
    def calculate_position_size(
        self,
        signal: TradeSignal,
        account_balance: float,
        risk_percentage: float = 0.02
    ) -> float:
        """Calculate position size based on risk management."""
        try:
            if not signal.price:
                return signal.quantity
            
            # Calculate position value
            position_value = signal.quantity * signal.price
            
            # Calculate risk amount
            risk_amount = account_balance * risk_percentage
            
            # Calculate stop loss distance
            stop_loss_distance = 0
            if signal.stop_loss:
                stop_loss_distance = abs(signal.price - signal.stop_loss)
            else:
                # Default stop loss at 2%
                stop_loss_distance = signal.price * 0.02
            
            # Calculate position size based on risk
            if stop_loss_distance > 0:
                max_position_size = risk_amount / stop_loss_distance
                return min(signal.quantity, max_position_size)
            
            return signal.quantity
            
        except Exception as e:
            trade_logger.log_error("Position sizing error", str(e))
            return signal.quantity
    
    def format_order_request(self, signal: TradeSignal) -> Dict[str, Any]:
        """Format order request for broker API."""
        return {
            "symbol": signal.symbol,
            "side": signal.side.value.lower(),
            "quantity": signal.quantity,
            "order_type": signal.order_type.value.lower(),
            "price": signal.price,
            "stop_loss": signal.stop_loss,
            "take_profit": signal.take_profit,
            "time_in_force": "GTC"
        }
    
    def parse_order_response(self, response: Dict[str, Any]) -> TradeExecution:
        """Parse broker order response."""
        try:
            return TradeExecution(
                signal=response["signal"],
                execution_id=response["order_id"],
                executed_price=response["executed_price"],
                executed_quantity=response["executed_quantity"],
                execution_time=response["execution_time"],
                fees=response.get("fees", 0.0),
                status=ExecutionStatus(response["status"]),
                broker_order_id=response["broker_order_id"]
            )
        except Exception as e:
            trade_logger.log_error("Order response parsing error", str(e))
            raise
    
    def handle_broker_error(self, error: Exception) -> None:
        """Handle broker-specific errors."""
        trade_logger.log_error(
            "Broker error",
            f"{self.__class__.__name__}: {str(error)}"
        )
    
    def log_order_activity(self, action: str, order_id: str, details: Dict[str, Any]) -> None:
        """Log order activity."""
        trade_logger.logger.info(
            f"Order {action}",
            order_id=order_id,
            broker=self.__class__.__name__,
            **details
        )
