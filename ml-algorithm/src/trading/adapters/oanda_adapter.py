"""Production-ready OANDA broker adapter using official oandapyV20 library."""

import asyncio
import time
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import backoff
from dataclasses import dataclass
from enum import Enum

import oandapyV20
import oandapyV20.endpoints.orders as orders
import oandapyV20.endpoints.trades as trades
import oandapyV20.endpoints.pricing as pricing
import oandapyV20.endpoints.accounts as accounts
import oandapyV20.endpoints.instruments as instruments
import oandapyV20.endpoints.positions as positions
from oandapyV20.exceptions import V20Error
from oandapyV20.endpoints.pricing import PricingInfo

from .base import BaseBrokerAdapter
from trading.schemas import TradeSignal, TradeExecution, Position, Side, OrderType, ExecutionStatus
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.execution")


class OandaOrderStatus(Enum):
    """OANDA order status enumeration."""
    PENDING = "PENDING"
    FILLED = "FILLED"
    TRIGGERED = "TRIGGERED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class OandaOrderType(Enum):
    """OANDA order type enumeration."""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"
    MARKET_IF_TOUCHED = "MARKET_IF_TOUCHED"
    TAKE_PROFIT = "TAKE_PROFIT"
    STOP_LOSS = "STOP_LOSS"
    TRAILING_STOP_LOSS = "TRAILING_STOP_LOSS"


@dataclass
class OandaAccountInfo:
    """OANDA account information data class."""
    account_id: str
    currency: str
    balance: Decimal
    nav: Decimal
    margin_available: Decimal
    margin_used: Decimal
    margin_rate: Decimal
    unrealized_pl: Decimal
    realized_pl: Decimal
    position_value: Decimal
    open_trade_count: int
    open_position_count: int
    pending_order_count: int
    hedging_enabled: bool
    margin_call_enabled: bool
    margin_call_extension_count: int
    last_margin_call_extension_time: Optional[datetime]
    last_transaction_id: str


class OandaAdapter(BaseBrokerAdapter):
    """Production-ready OANDA broker adapter using official oandapyV20 library."""

    def __init__(self, api_key: str, secret_key: str, sandbox: bool = True):
        super().__init__(api_key, secret_key, sandbox)

        # Initialize OANDA client
        environment = "practice" if sandbox else "live"
        self.client = oandapyV20.API(
            access_token=api_key,
            environment=environment
        )

        # Account ID (will be set during connection)
        self.account_id: Optional[str] = None

        # Connection state
        self.is_connected = False
        self.connection_retry_count = 0
        self.max_retry_attempts = 5
        self.retry_delay = 1.0

        # Account info cache
        self._account_info_cache: Optional[OandaAccountInfo] = None
        self._account_info_cache_time: Optional[datetime] = None
        self._account_info_cache_ttl = timedelta(minutes=1)

        # Market data cache
        self._market_data_cache: Dict[str, Dict[str, Any]] = {}
        self._market_data_cache_ttl = timedelta(seconds=1)

        # Order tracking
        self._pending_orders: Dict[str, TradeExecution] = {}
        self._order_status_cache: Dict[str, Dict[str, Any]] = {}

        # Error tracking
        self._error_count = 0
        self._last_error_time: Optional[datetime] = None
        self._circuit_breaker_threshold = 10
        self._circuit_breaker_timeout = timedelta(minutes=5)
        self._circuit_breaker_active = False

        # Instruments cache
        self._instruments_cache: List[Dict[str, Any]] = []
        self._instruments_cache_time: Optional[datetime] = None
        self._instruments_cache_ttl = timedelta(hours=1)

    async def connect(self) -> bool:
        """Connect to OANDA API with comprehensive error handling and retry logic."""
        if self._circuit_breaker_active:
            if self._last_error_time and datetime.now(
                    timezone.utc) - self._last_error_time < self._circuit_breaker_timeout:
                trade_logger.logger.warning(
                    "Circuit breaker active, connection blocked")
                return False
            else:
                self._circuit_breaker_active = False
                self._error_count = 0

        for attempt in range(self.max_retry_attempts):
            try:
                # Get account ID
                if not self.account_id:
                    accounts = await self._get_accounts_async()
                    if accounts:
                        self.account_id = accounts[0]["id"]
                    else:
                        raise Exception("No accounts found")

                # Test connection by getting account info
                account_info = await self._get_account_info_async()

                if account_info:
                    self.is_connected = True
                    self.connection_retry_count = 0
                    self._error_count = 0

                    # Cache account info
                    self._account_info_cache = account_info
                    self._account_info_cache_time = datetime.now(timezone.utc)

                    trade_logger.logger.info(
                        "Successfully connected to OANDA API",
                        extra={
                            "sandbox": self.sandbox,
                            "account_id": account_info.account_id,
                            "currency": account_info.currency,
                            "balance": float(account_info.balance)
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
                    # Exponential backoff
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))
                else:
                    self._handle_connection_failure(e)
                    return False

        return False

    async def disconnect(self) -> bool:
        """Disconnect from OANDA API and cleanup resources."""
        try:
            self.is_connected = False

            # Clear caches
            self._account_info_cache = None
            self._market_data_cache.clear()
            self._order_status_cache.clear()
            self._instruments_cache.clear()

            trade_logger.logger.info("Disconnected from OANDA API")
            return True

        except Exception as e:
            trade_logger.logger.error(f"Error during disconnect: {e}")
            return False

    async def _get_accounts_async(self) -> List[Dict[str, Any]]:
        """Get accounts asynchronously."""
        loop = asyncio.get_event_loop()
        try:
            r = accounts.Accounts()
            response = await loop.run_in_executor(None, lambda: self.client.request(r))
            return response.get('accounts', [])
        except V20Error as e:
            trade_logger.logger.error(f"Failed to get accounts: {e}")
            return []
        except Exception as e:
            trade_logger.logger.error(
                f"Unexpected error getting accounts: {e}")
            return []

    async def _get_account_info_async(self) -> Optional[OandaAccountInfo]:
        """Get account info asynchronously."""
        if not self.account_id:
            return None

        loop = asyncio.get_event_loop()
        try:
            r = accounts.AccountDetails(self.account_id)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))
            return self._parse_account_info(response['account'])
        except V20Error as e:
            trade_logger.logger.error(f"Failed to get account info: {e}")
            return None
        except Exception as e:
            trade_logger.logger.error(
                f"Unexpected error getting account info: {e}")
            return None

    def _parse_account_info(self, data: Dict[str, Any]) -> OandaAccountInfo:
        """Parse account information from API response."""
        return OandaAccountInfo(account_id=data["id"],
                                currency=data["currency"],
                                balance=Decimal(str(data["balance"])),
                                nav=Decimal(str(data["NAV"])),
                                margin_available=Decimal(str(data["marginAvailable"])),
                                margin_used=Decimal(str(data["marginUsed"])),
                                margin_rate=Decimal(str(data["marginRate"])),
                                unrealized_pl=Decimal(str(data["unrealizedPL"])),
                                realized_pl=Decimal(str(data["realizedPL"])),
                                position_value=Decimal(str(data["positionValue"])),
                                open_trade_count=data["openTradeCount"],
                                open_position_count=data["openPositionCount"],
                                pending_order_count=data["pendingOrderCount"],
                                hedging_enabled=data["hedgingEnabled"],
                                margin_call_enabled=data["marginCallEnabled"],
                                margin_call_extension_count=data["marginCallExtensionCount"],
                                last_margin_call_extension_time=datetime.fromisoformat(data["lastMarginCallExtensionTime"].replace('Z',
                                                                                                                                   '+00:00')) if data.get("lastMarginCallExtensionTime") else None,
                                last_transaction_id=data["lastTransactionID"])

    def _handle_connection_failure(self, error: Exception):
        """Handle connection failure and activate circuit breaker if necessary."""
        self._last_error_time = datetime.now(timezone.utc)

        if self._error_count >= self._circuit_breaker_threshold:
            self._circuit_breaker_active = True
            trade_logger.logger.error(
                "Circuit breaker activated due to repeated connection failures", extra={
                    "error_count": self._error_count, "error": str(error)})

        self.is_connected = False

    def _map_order_type(self, order_type: OrderType) -> str:
        """Map order type to OANDA format."""
        mapping = {
            OrderType.MARKET: OandaOrderType.MARKET.value,
            OrderType.LIMIT: OandaOrderType.LIMIT.value,
            OrderType.STOP: OandaOrderType.STOP.value,
            OrderType.STOP_LIMIT: OandaOrderType.STOP.value
        }
        return mapping.get(order_type, OandaOrderType.MARKET.value)

    def _map_execution_status(self, oanda_status: str) -> ExecutionStatus:
        """Map OANDA order status to ExecutionStatus."""
        status_mapping = {
            OandaOrderStatus.PENDING.value: ExecutionStatus.PENDING,
            OandaOrderStatus.FILLED.value: ExecutionStatus.FILLED,
            OandaOrderStatus.TRIGGERED.value: ExecutionStatus.FILLED,
            OandaOrderStatus.CANCELLED.value: ExecutionStatus.CANCELLED,
            OandaOrderStatus.REJECTED.value: ExecutionStatus.REJECTED
        }
        return status_mapping.get(oanda_status, ExecutionStatus.UNKNOWN)

    async def place_order(self, signal: TradeSignal) -> TradeExecution:
        """Place an order with OANDA using official oandapyV20 library."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Validate signal
            if not self.validate_signal(signal):
                raise ValueError("Invalid trading signal")

            # Check account status
            account_info = await self.get_account_info()
            if account_info.margin_available <= 0:
                raise Exception("Insufficient margin available")

            # Prepare order data
            order_data = {
                "order": {
                    "instrument": signal.symbol,
                    "units": str(int(signal.quantity)) if signal.side == Side.BUY else str(-int(signal.quantity)),
                    "type": self._map_order_type(signal.order_type),
                    "positionFill": "DEFAULT",
                    "timeInForce": "FOK"  # Fill or Kill
                }
            }

            # Add price for limit orders
            if signal.order_type == OrderType.LIMIT and signal.price:
                order_data["order"]["price"] = str(signal.price)

            # Add stop loss
            if signal.stop_loss:
                order_data["order"]["stopLossOnFill"] = StopLossDetails(
                    price=str(signal.stop_loss)).data

            # Add take profit
            if signal.take_profit:
                order_data["order"]["takeProfitOnFill"] = TakeProfitDetails(
                    price=str(signal.take_profit)).data

            # Place order using official library
            loop = asyncio.get_event_loop()
            r = orders.OrderCreate(self.account_id, data=order_data)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            # Create execution object
            order_info = response["orderCreateTransaction"]
            execution = self._create_execution_from_response(
                signal, order_info)

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

        except V20Error as e:
            trade_logger.logger.error(
                f"OANDA API error placing order: {e}",
                extra={"symbol": signal.symbol}
            )
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
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

    def _create_execution_from_response(
            self, signal: TradeSignal, order_info: Dict[str, Any]) -> TradeExecution:
        """Create TradeExecution from OANDA order response."""
        return TradeExecution(
            signal=signal,
            execution_id=order_info["id"],
            executed_price=float(order_info.get("price", 0)),
            executed_quantity=abs(float(order_info.get("units", 0))),
            execution_time=datetime.now(timezone.utc),
            fees=float(order_info.get("financing", 0)),
            status=self._map_execution_status(order_info["state"]),
            broker_order_id=order_info["id"],
            metadata={
                "oanda_status": order_info["state"],
                "instrument": order_info.get("instrument"),
                "time_in_force": order_info.get("timeInForce"),
                "position_fill": order_info.get("positionFill"),
                "reason": order_info.get("reason"),
                "client_extensions": order_info.get("clientExtensions", {}),
                "take_profit_on_fill": order_info.get("takeProfitOnFill"),
                "stop_loss_on_fill": order_info.get("stopLossOnFill")
            }
        )

    async def get_current_price(self, symbol: str) -> float:
        """Get current price for symbol with caching."""
        # Check cache first
        if symbol in self._market_data_cache:
            cache_time = self._market_data_cache[symbol].get("timestamp")
            if cache_time and datetime.now(
                    timezone.utc) - cache_time < self._market_data_cache_ttl:
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
            trade_logger.logger.error(
                f"Failed to get current price for {symbol}: {e}")
            raise

    async def update_order(self, order_id: str,
                           updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing order using official oandapyV20 library."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Prepare update data
            update_data = {"order": {}}

            if "quantity" in updates:
                update_data["order"]["units"] = str(int(updates["quantity"]))

            if "price" in updates:
                update_data["order"]["price"] = str(updates["price"])

            if "stop_loss" in updates:
                update_data["order"]["stopLossOnFill"] = StopLossDetails(
                    price=str(updates["stop_loss"])).data

            if "take_profit" in updates:
                update_data["order"]["takeProfitOnFill"] = TakeProfitDetails(
                    price=str(updates["take_profit"])).data

            # Update order using official library
            loop = asyncio.get_event_loop()
            r = orders.OrderClientExtensions(
                self.account_id, orderID=order_id, data=update_data)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            trade_logger.logger.info(
                f"Order {order_id} updated successfully",
                extra={
                    "order_id": order_id,
                    "updates": updates
                }
            )

            return {
                "message": "Order updated successfully",
                "order_id": order_id,
                "response": response
            }

        except V20Error as e:
            trade_logger.logger.error(f"OANDA API error updating order: {e}")
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
        except Exception as e:
            trade_logger.logger.error(
                f"Failed to update order {order_id}: {e}")
            self.handle_broker_error(e)
            raise

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order using official oandapyV20 library."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Cancel order using official library
            loop = asyncio.get_event_loop()
            r = orders.OrderCancel(self.account_id, orderID=order_id)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            if response:
                # Remove from pending orders
                if order_id in self._pending_orders:
                    del self._pending_orders[order_id]

                # Remove from status cache
                if order_id in self._order_status_cache:
                    del self._order_status_cache[order_id]

                trade_logger.logger.info(
                    f"Order {order_id} cancelled successfully")
                return True
            else:
                raise Exception("Failed to cancel order")

        except V20Error as e:
            trade_logger.logger.error(f"OANDA API error cancelling order: {e}")
            self.handle_broker_error(e)
            return False
        except Exception as e:
            trade_logger.logger.error(
                f"Failed to cancel order {order_id}: {e}")
            self.handle_broker_error(e)
            return False

    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status with caching using official oandapyV20 library."""
        try:
            # Check cache first
            if order_id in self._order_status_cache:
                cache_time = self._order_status_cache[order_id].get(
                    "cache_time")
                if cache_time and datetime.now(
                        timezone.utc) - cache_time < timedelta(seconds=30):
                    return self._order_status_cache[order_id]["data"]

            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Get order details using official library
            loop = asyncio.get_event_loop()
            r = orders.OrderDetails(self.account_id, orderID=order_id)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            if response:
                # Update cache
                self._order_status_cache[order_id] = {
                    "data": response,
                    "cache_time": datetime.now(timezone.utc)
                }

                return response
            else:
                raise Exception(f"Order {order_id} not found")

        except V20Error as e:
            trade_logger.logger.error(
                f"OANDA API error getting order status: {e}")
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
        except Exception as e:
            trade_logger.logger.error(
                f"Failed to get order status for {order_id}: {e}")
            self.handle_broker_error(e)
            raise

    async def get_positions(self) -> List[Position]:
        """Get current positions using official oandapyV20 library."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Get positions using official library
            loop = asyncio.get_event_loop()
            r = positions.OpenPositions(self.account_id)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            positions_list = []
            for instrument, pos_data in response["positions"].items():
                long_units = float(pos_data["long"]["units"])
                short_units = float(pos_data["short"]["units"])
                net_units = long_units - short_units

                if net_units != 0:
                    # Use long or short data based on net position
                    if net_units > 0:
                        avg_price = float(pos_data["long"]["averagePrice"])
                        unrealized_pnl = float(
                            pos_data["long"]["unrealizedPL"])
                    else:
                        avg_price = float(pos_data["short"]["averagePrice"])
                        unrealized_pnl = float(
                            pos_data["short"]["unrealizedPL"])

                    # Get current price
                    try:
                        market_data = await self.get_market_data(instrument)
                        current_price = float(market_data["last"])
                    except BaseException:
                        current_price = avg_price

                    market_value = abs(net_units) * current_price

                    position = Position(
                        symbol=instrument,
                        quantity=net_units,
                        average_price=avg_price,
                        unrealized_pnl=unrealized_pnl,
                        realized_pnl=0,
                        market_value=market_value,
                        timestamp=datetime.now(
                            timezone.utc),
                        metadata={
                            "long_units": long_units,
                            "short_units": short_units,
                            "current_price": current_price,
                            "margin_used": float(
                                pos_data.get(
                                    "marginUsed",
                                    0)),
                            "resettable_pl": float(
                                pos_data.get(
                                    "resettablePL",
                                    0))})
                    positions_list.append(position)

            return positions_list

        except V20Error as e:
            trade_logger.logger.error(
                f"OANDA API error getting positions: {e}")
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
        except Exception as e:
            trade_logger.logger.error(f"Failed to get positions: {e}")
            self.handle_broker_error(e)
            raise

    async def get_account_info(self) -> OandaAccountInfo:
        """Get account information with caching using official oandapyV20 library."""
        try:
            # Check cache first
            if (self._account_info_cache and self._account_info_cache_time and datetime.now(
                    timezone.utc) - self._account_info_cache_time < self._account_info_cache_ttl):
                return self._account_info_cache

            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Fetch from API using official library
            loop = asyncio.get_event_loop()
            r = accounts.AccountDetails(self.account_id)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            if response:
                # Parse and cache account info
                self._account_info_cache = self._parse_account_info(
                    response['account'])
                self._account_info_cache_time = datetime.now(timezone.utc)

                return self._account_info_cache
            else:
                raise Exception("Failed to retrieve account information")

        except V20Error as e:
            trade_logger.logger.error(
                f"OANDA API error getting account info: {e}")
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
        except Exception as e:
            trade_logger.logger.error(f"Failed to get account info: {e}")
            self.handle_broker_error(e)
            raise

    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """Get market data for symbol using official oandapyV20 library."""
        try:
            # Check cache first
            if symbol in self._market_data_cache:
                cache_time = self._market_data_cache[symbol].get("timestamp")
                if cache_time and datetime.now(
                        timezone.utc) - cache_time < self._market_data_cache_ttl:
                    return self._market_data_cache[symbol]

            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Get pricing using official library
            loop = asyncio.get_event_loop()
            params = {"instruments": symbol}
            r = PricingInfo(self.account_id, params=params)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            if response and "prices" in response and response["prices"]:
                price_data = response["prices"][0]
                bid = float(price_data["bids"][0]["price"])
                ask = float(price_data["asks"][0]["price"])
                last = (bid + ask) / 2

                market_data = {
                    "symbol": symbol,
                    "bid": bid,
                    "ask": ask,
                    "last": last,
                    "spread": ask - bid,
                    "timestamp": int(price_data["time"]),
                    "status": price_data.get("status", "tradeable"),
                    "tradeable": price_data.get("tradeable", True)
                }

                # Update cache
                self._market_data_cache[symbol] = market_data

                return market_data
            else:
                raise Exception(f"No price data available for {symbol}")

        except V20Error as e:
            trade_logger.logger.error(
                f"OANDA API error getting market data: {e}")
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
        except Exception as e:
            trade_logger.logger.error(
                f"Failed to get market data for {symbol}: {e}")
            self.handle_broker_error(e)
            raise

    async def get_instruments(self) -> List[Dict[str, Any]]:
        """Get available instruments using official oandapyV20 library."""
        try:
            # Check cache first
            if (self._instruments_cache and self._instruments_cache_time and datetime.now(
                    timezone.utc) - self._instruments_cache_time < self._instruments_cache_ttl):
                return self._instruments_cache

            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Get instruments using official library
            loop = asyncio.get_event_loop()
            r = accounts.AccountInstruments(self.account_id)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            if response and "instruments" in response:
                # Update cache
                self._instruments_cache = response["instruments"]
                self._instruments_cache_time = datetime.now(timezone.utc)

                return self._instruments_cache
            else:
                return []

        except V20Error as e:
            trade_logger.logger.error(
                f"OANDA API error getting instruments: {e}")
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
        except Exception as e:
            trade_logger.logger.error(f"Failed to get instruments: {e}")
            self.handle_broker_error(e)
            raise

    async def get_historical_data(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        timeframe: str = "D",
        count: int = 500
    ) -> List[Dict[str, Any]]:
        """Get historical data from OANDA using official oandapyV20 library."""
        try:
            if not self.is_connected:
                if not await self.connect():
                    raise Exception("Failed to connect to OANDA API")

            # Convert timeframe
            granularity_map = {
                "1m": "M1",
                "5m": "M5",
                "15m": "M15",
                "30m": "M30",
                "1h": "H1",
                "2h": "H2",
                "4h": "H4",
                "6h": "H6",
                "8h": "H8",
                "12h": "H12",
                "1d": "D",
                "1w": "W",
                "1M": "M"
            }
            granularity = granularity_map.get(timeframe, "D")

            # Prepare parameters
            params = {
                "granularity": granularity,
                "count": count
            }

            if start_date:
                params["from"] = start_date
            if end_date:
                params["to"] = end_date

            # Get historical candles using official library
            loop = asyncio.get_event_loop()
            r = instruments.InstrumentsCandles(
                instrument=symbol, params=params)
            response = await loop.run_in_executor(None, lambda: self.client.request(r))

            if response and "candles" in response:
                # Convert to standardized format
                historical_data = []
                for candle_data in response["candles"]:
                    if candle_data["complete"]:  # Only include complete candles
                        candle = candle_data["mid"]
                        historical_data.append({
                            "timestamp": int(candle_data["time"]),
                            "open": float(candle["o"]),
                            "high": float(candle["h"]),
                            "low": float(candle["l"]),
                            "close": float(candle["c"]),
                            "volume": int(candle_data["volume"]),
                            "complete": candle_data["complete"]
                        })

                return historical_data
            else:
                return []

        except V20Error as e:
            trade_logger.logger.error(
                f"OANDA API error getting historical data: {e}")
            self.handle_broker_error(e)
            raise Exception(f"OANDA API error: {e}")
        except Exception as e:
            trade_logger.logger.error(
                f"Failed to get historical data for {symbol}: {e}")
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

            if signal.order_type not in [
                    OrderType.MARKET,
                    OrderType.LIMIT,
                    OrderType.STOP,
                    OrderType.STOP_LIMIT]:
                return False

            # Price validation for limit orders
            if signal.order_type in [
                    OrderType.LIMIT,
                    OrderType.STOP_LIMIT] and not signal.price:
                return False

            if signal.price and signal.price <= 0:
                return False

            # Stop loss and take profit validation
            if signal.stop_loss and signal.stop_loss <= 0:
                return False

            if signal.take_profit and signal.take_profit <= 0:
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
                "broker": "OANDA",
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
                    "broker": "OANDA"
                }
            )
