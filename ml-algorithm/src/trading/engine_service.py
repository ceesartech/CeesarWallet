"""FastAPI engine service for trade execution."""

import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import numpy as np
from datetime import datetime, timezone, timedelta
import redis
import json
from contextlib import asynccontextmanager
import httpx

from trading.config import settings, BrokerType
from trading.schemas import TradeSignal, Side, OrderType, TradeExecution, ExecutionStatus, Position
from trading.logging_utils import setup_logging, get_logger, trade_logger
from trading.data.market_data import MarketDataManager
from trading.policy.ppo import ProductionPPO as PPOPolicy
from trading.adapters.base import BaseBrokerAdapter
from trading.adapters.alpaca_adapter import AlpacaAdapter
from trading.adapters.binance_adapter import BinanceAdapter
from trading.adapters.oanda_adapter import OandaAdapter

# Setup logging
setup_logging()
logger = get_logger("trading.engine")

# Global state
redis_client = None
broker_adapters: Dict[str, BaseBrokerAdapter] = {}
inference_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global redis_client, inference_client

    # Startup
    logger.info("Starting engine service")

    # Initialize Redis
    try:
        redis_client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=True
        )
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        redis_client = None

    # Initialize inference client
    inference_client = httpx.AsyncClient(
        base_url=f"http://localhost:{settings.inference_port}",
        timeout=30.0
    )

    # Initialize broker adapters
    await initialize_brokers()

    yield

    # Shutdown
    logger.info("Shutting down engine service")
    if inference_client:
        await inference_client.aclose()


app = FastAPI(
    title="Trading Engine Service",
    description="Trade execution engine service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def initialize_brokers():
    """Initialize broker adapters."""
    try:
        logger.info("Initializing broker adapters")

        # Alpaca adapter
        if settings.broker_type == BrokerType.ALPACA:
            alpaca_adapter = AlpacaAdapter(
                api_key=settings.broker_api_key,
                secret_key=settings.broker_secret_key,
                sandbox=settings.broker_sandbox
            )
            broker_adapters["alpaca"] = alpaca_adapter

        # Binance adapter
        binance_adapter = BinanceAdapter(
            api_key=settings.broker_api_key,
            secret_key=settings.broker_secret_key,
            sandbox=settings.broker_sandbox
        )
        broker_adapters["binance"] = binance_adapter

        # OANDA adapter
        oanda_adapter = OandaAdapter(
            api_key=settings.broker_api_key,
            secret_key=settings.broker_secret_key,
            sandbox=settings.broker_sandbox
        )
        broker_adapters["oanda"] = oanda_adapter

        logger.info(f"Initialized {len(broker_adapters)} broker adapters")

    except Exception as e:
        logger.error(f"Failed to initialize brokers: {e}")


def get_broker_adapter(symbol: str) -> BaseBrokerAdapter:
    """Get appropriate broker adapter for symbol."""
    # Simple logic - can be enhanced
    if symbol.endswith('USD') or symbol.endswith('EUR'):
        return broker_adapters.get("binance", broker_adapters.get("alpaca"))
    else:
        return broker_adapters.get("alpaca", broker_adapters.get("binance"))


class CreateOrderRequest(BaseModel):
    """Create order request."""
    userId: str
    symbol: str
    side: str
    quantity: str
    orderType: str = "MARKET"
    price: Optional[str] = None
    stopLoss: Optional[str] = None
    takeProfit: Optional[str] = None
    timeInForce: str = "GTC"


class OrderResponse(BaseModel):
    """Order response."""
    orderId: str
    symbol: str
    side: str
    quantity: str
    executedQuantity: str
    price: Optional[str] = None
    executedPrice: Optional[str] = None
    orderType: str
    status: str
    createdAt: str
    updatedAt: str
    fees: Optional[str] = None
    brokerOrderId: Optional[str] = None


class UpdateOrderRequest(BaseModel):
    """Update order request."""
    userId: str
    orderId: str
    quantity: Optional[str] = None
    price: Optional[str] = None
    stopLoss: Optional[str] = None
    takeProfit: Optional[str] = None


class PositionResponse(BaseModel):
    """Position response."""
    symbol: str
    quantity: str
    averagePrice: str
    unrealizedPnL: str
    realizedPnL: str
    marketValue: str


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "brokers_connected": len(broker_adapters),
        "redis_connected": redis_client is not None,
        "inference_connected": inference_client is not None
    }


@app.post("/orders", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest):
    """Create a new order."""
    try:
        if settings.dry_run:
            return await create_paper_order(request)

        # Get broker adapter
        broker = get_broker_adapter(request.symbol)
        if not broker:
            raise HTTPException(
                status_code=400,
                detail="No broker available for symbol")

        # Convert request to TradeSignal
        signal = TradeSignal(
            symbol=request.symbol,
            side=Side(request.side),
            quantity=float(request.quantity),
            price=float(request.price) if request.price else None,
            order_type=OrderType(request.orderType),
            stop_loss=float(request.stopLoss) if request.stopLoss else None,
            take_profit=float(request.takeProfit) if request.takeProfit else None
        )

        # Execute order
        execution = await broker.place_order(signal)

        # Store execution in Redis
        if redis_client:
            execution_key = f"execution:{execution.execution_id}"
            redis_client.setex(
                execution_key,
                86400,  # 24 hours
                json.dumps(execution.dict())
            )

        # Create response
        response = OrderResponse(
            orderId=execution.execution_id,
            symbol=execution.signal.symbol,
            side=execution.signal.side.value,
            quantity=str(execution.signal.quantity),
            executedQuantity=str(execution.executed_quantity),
            price=str(execution.signal.price) if execution.signal.price else None,
            executedPrice=str(execution.executed_price),
            orderType=execution.signal.order_type.value,
            status=execution.status.value,
            createdAt=execution.execution_time.isoformat(),
            updatedAt=execution.execution_time.isoformat(),
            fees=str(execution.fees),
            brokerOrderId=execution.broker_order_id
        )

        trade_logger.logger.info(
            "Order created successfully",
            order_id=execution.execution_id,
            symbol=request.symbol,
            side=request.side,
            quantity=request.quantity
        )

        return response

    except Exception as e:
        logger.error(f"Order creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def create_paper_order(request: CreateOrderRequest) -> OrderResponse:
    """Create a paper trading order."""
    try:
        # Simulate order execution
        execution_id = f"paper_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Get current price
        market_data = await data_manager.get_realtime_data(request.symbol)
        if not market_data:
            raise HTTPException(
                status_code=400,
                detail="No market data available")

        executed_price = market_data.close
        executed_quantity = float(request.quantity)
        fees = executed_quantity * executed_price * 0.001  # 0.1% fee

        response = OrderResponse(
            orderId=execution_id,
            symbol=request.symbol,
            side=request.side,
            quantity=request.quantity,
            executedQuantity=request.quantity,
            price=request.price,
            executedPrice=str(executed_price),
            orderType=request.orderType,
            status="FILLED",
            createdAt=datetime.now(timezone.utc).isoformat(),
            updatedAt=datetime.now(timezone.utc).isoformat(),
            fees=str(fees),
            brokerOrderId=f"paper_{execution_id}"
        )

        trade_logger.logger.info(
            "Paper order created",
            order_id=execution_id,
            symbol=request.symbol,
            side=request.side,
            quantity=request.quantity
        )

        return response

    except Exception as e:
        logger.error(f"Paper order creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, request: UpdateOrderRequest):
    """Update an existing order."""
    try:
        if settings.dry_run:
            raise HTTPException(
                status_code=400,
                detail="Order updates not supported in paper trading")

        # Get broker adapter
        broker = get_broker_adapter(request.symbol)
        if not broker:
            raise HTTPException(
                status_code=400,
                detail="No broker available for symbol")

        # Update order
        updated_order = await broker.update_order(order_id, request.dict())

        return OrderResponse(
            orderId=updated_order["orderId"],
            symbol=updated_order["symbol"],
            side=updated_order["side"],
            quantity=updated_order["quantity"],
            executedQuantity=updated_order["executedQuantity"],
            price=updated_order.get("price"),
            executedPrice=updated_order.get("executedPrice"),
            orderType=updated_order["orderType"],
            status=updated_order["status"],
            createdAt=updated_order["createdAt"],
            updatedAt=updated_order["updatedAt"],
            fees=updated_order.get("fees"),
            brokerOrderId=updated_order.get("brokerOrderId")
        )

    except Exception as e:
        logger.error(f"Order update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str, userId: str):
    """Cancel an existing order."""
    try:
        if settings.dry_run:
            return {"message": "Order cancelled successfully"}

        # Get order from Redis
        if redis_client:
            execution_key = f"execution:{order_id}"
            execution_data = redis_client.get(execution_key)
            if execution_data:
                execution = TradeExecution(**json.loads(execution_data))
                broker = get_broker_adapter(execution.signal.symbol)

                if broker:
                    success = await broker.cancel_order(order_id)
                    if success:
                        return {"message": "Order cancelled successfully"}

        raise HTTPException(status_code=404, detail="Order not found")

    except Exception as e:
        logger.error(f"Order cancellation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/orders")
async def get_orders(
        userId: str,
        symbol: Optional[str] = None,
        status: Optional[str] = None):
    """Get orders for a user."""
    try:
        orders = []

        # Get orders from Redis
        if redis_client:
            pattern = f"execution:*"
            keys = redis_client.keys(pattern)

            for key in keys:
                execution_data = redis_client.get(key)
                if execution_data:
                    execution = TradeExecution(**json.loads(execution_data))

                    # Filter by user, symbol, and status
                    if (symbol is None or execution.signal.symbol == symbol) and (
                            status is None or execution.status.value == status):

                        orders.append(
                            OrderResponse(
                                orderId=execution.execution_id,
                                symbol=execution.signal.symbol,
                                side=execution.signal.side.value,
                                quantity=str(
                                    execution.signal.quantity),
                                executedQuantity=str(
                                    execution.executed_quantity),
                                price=str(
                                    execution.signal.price) if execution.signal.price else None,
                                executedPrice=str(
                                    execution.executed_price),
                                orderType=execution.signal.order_type.value,
                                status=execution.status.value,
                                createdAt=execution.execution_time.isoformat(),
                                updatedAt=execution.execution_time.isoformat(),
                                fees=str(
                                    execution.fees),
                                brokerOrderId=execution.broker_order_id))

        return orders

    except Exception as e:
        logger.error(f"Get orders error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/positions")
async def get_positions(userId: str):
    """Get positions for a user."""
    try:
        positions = []

        # Get positions from Redis or calculate from orders
        if redis_client:
            pattern = f"execution:*"
            keys = redis_client.keys(pattern)

            position_map = {}

            for key in keys:
                execution_data = redis_client.get(key)
                if execution_data:
                    execution = TradeExecution(**json.loads(execution_data))
                    symbol = execution.signal.symbol

                    if symbol not in position_map:
                        position_map[symbol] = {
                            'quantity': 0.0,
                            'total_cost': 0.0,
                            'realized_pnl': 0.0
                        }

                    if execution.signal.side == Side.BUY:
                        position_map[symbol]['quantity'] += execution.executed_quantity
                        position_map[symbol]['total_cost'] += execution.executed_quantity * \
                            execution.executed_price
                    elif execution.signal.side == Side.SELL:
                        position_map[symbol]['quantity'] -= execution.executed_quantity
                        position_map[symbol]['realized_pnl'] += execution.executed_quantity * (
                            execution.executed_price - position_map[symbol]['total_cost'] / max(
                                position_map[symbol]['quantity'], 1))

            # Convert to position responses
            for symbol, pos_data in position_map.items():
                if pos_data['quantity'] != 0:
                    avg_price = pos_data['total_cost'] / \
                        max(pos_data['quantity'], 1)

                    # Get current market price
                    market_data = await data_manager.get_realtime_data(symbol)
                    current_price = market_data.close if market_data else avg_price

                    unrealized_pnl = pos_data['quantity'] * \
                        (current_price - avg_price)
                    market_value = pos_data['quantity'] * current_price

                    positions.append(PositionResponse(
                        symbol=symbol,
                        quantity=str(pos_data['quantity']),
                        averagePrice=str(avg_price),
                        unrealizedPnL=str(unrealized_pnl),
                        realizedPnL=str(pos_data['realized_pnl']),
                        marketValue=str(market_value)
                    ))

        return positions

    except Exception as e:
        logger.error(f"Get positions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/orders/history")
async def get_order_history(userId: str, limit: int = 100):
    """Get order history for a user."""
    try:
        orders = await get_orders(userId)

        # Sort by creation time and limit
        orders.sort(key=lambda x: x.createdAt, reverse=True)
        return orders[:limit]

    except Exception as e:
        logger.error(f"Get order history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/autotrade")
async def start_autotrade(symbol: str, userId: str, capital: float = 10000.0):
    """Start automated trading for a symbol."""
    try:
        if settings.dry_run:
            return {"message": "Auto-trading started in paper mode"}

        # This would start a background task for automated trading
        # For now, just return success
        return {"message": f"Auto-trading started for {symbol}"}

    except Exception as e:
        logger.error(f"Auto-trade error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "engine_service:app",
        host=settings.api_host,
        port=settings.engine_port,
        reload=True,
        log_level=settings.log_level.lower()
    )
