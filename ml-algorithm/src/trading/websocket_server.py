"""
WebSocket Server Mock for CeesarWallet Trading Platform
This module provides WebSocket connections for real-time data
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Any
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from trading.config import settings
from trading.logging_utils import get_logger

# Initialize logger
logger = get_logger("websocket_server")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "market_data": set(),
            "trade_signals": set(),
            "portfolio_updates": set(),
            "fraud_alerts": set()
        }

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        self.active_connections[channel].add(websocket)
        logger.info(f"WebSocket connected to channel: {channel}")

    def disconnect(self, websocket: WebSocket, channel: str):
        self.active_connections[channel].discard(websocket)
        logger.info(f"WebSocket disconnected from channel: {channel}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_channel(self, message: str, channel: str):
        if channel in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(message)
                except WebSocketDisconnect:
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for connection in disconnected:
                self.active_connections[channel].discard(connection)

# Initialize connection manager
manager = ConnectionManager()

# Create FastAPI app
app = FastAPI(
    title="CeesarWallet WebSocket Server",
    description="WebSocket server for real-time trading data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data generators
def generate_market_data(symbol: str) -> Dict[str, Any]:
    """Generate mock market data"""
    import random
    base_price = 150.0
    price_change = random.uniform(-2.0, 2.0)
    
    return {
        "type": "market_data",
        "symbol": symbol,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "open": base_price,
        "high": base_price + abs(price_change),
        "low": base_price - abs(price_change),
        "close": base_price + price_change,
        "volume": random.randint(100000, 2000000)
    }

def generate_trade_signal(symbol: str) -> Dict[str, Any]:
    """Generate mock trade signal"""
    import random
    
    return {
        "type": "trade_signal",
        "id": f"signal_{datetime.now().timestamp()}",
        "symbol": symbol,
        "action": random.choice(["BUY", "SELL", "HOLD"]),
        "quantity": random.uniform(10.0, 1000.0),
        "price": random.uniform(140.0, 160.0),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }

def generate_portfolio_update(user_id: str) -> Dict[str, Any]:
    """Generate mock portfolio update"""
    import random
    
    return {
        "type": "portfolio_update",
        "user_id": user_id,
        "total_value": random.uniform(95000.0, 105000.0),
        "cash": random.uniform(20000.0, 30000.0),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def generate_fraud_alert() -> Dict[str, Any]:
    """Generate mock fraud alert"""
    import random
    
    return {
        "type": "fraud_alert",
        "alert_id": f"alert_{datetime.now().timestamp()}",
        "fraud_score": random.uniform(0.0, 1.0),
        "risk_level": random.choice(["low", "medium", "high"]),
        "description": "Suspicious trading pattern detected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# WebSocket endpoints
@app.websocket("/ws/market-data/{symbol}")
async def market_data_websocket(websocket: WebSocket, symbol: str):
    """WebSocket endpoint for market data"""
    await manager.connect(websocket, "market_data")
    
    try:
        while True:
            # Send mock market data every 5 seconds
            data = generate_market_data(symbol)
            await manager.send_personal_message(json.dumps(data), websocket)
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, "market_data")

@app.websocket("/ws/trade-signals")
async def trade_signals_websocket(websocket: WebSocket):
    """WebSocket endpoint for trade signals"""
    await manager.connect(websocket, "trade_signals")
    
    try:
        while True:
            # Send mock trade signals every 10 seconds
            data = generate_trade_signal("AAPL")
            await manager.send_personal_message(json.dumps(data), websocket)
            await asyncio.sleep(10)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, "trade_signals")

@app.websocket("/ws/portfolio-updates/{user_id}")
async def portfolio_updates_websocket(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for portfolio updates"""
    await manager.connect(websocket, "portfolio_updates")
    
    try:
        while True:
            # Send mock portfolio updates every 15 seconds
            data = generate_portfolio_update(user_id)
            await manager.send_personal_message(json.dumps(data), websocket)
            await asyncio.sleep(15)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, "portfolio_updates")

@app.websocket("/ws/fraud-alerts")
async def fraud_alerts_websocket(websocket: WebSocket):
    """WebSocket endpoint for fraud alerts"""
    await manager.connect(websocket, "fraud_alerts")
    
    try:
        while True:
            # Send mock fraud alerts every 30 seconds
            data = generate_fraud_alert()
            await manager.send_personal_message(json.dumps(data), websocket)
            await asyncio.sleep(30)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, "fraud_alerts")

@app.websocket("/ws/all")
async def all_channels_websocket(websocket: WebSocket):
    """WebSocket endpoint for all channels"""
    # Connect to all channels
    for channel in manager.active_connections.keys():
        await manager.connect(websocket, channel)
    
    try:
        while True:
            # Send data from all channels
            data = {
                "market_data": generate_market_data("AAPL"),
                "trade_signal": generate_trade_signal("AAPL"),
                "portfolio_update": generate_portfolio_update("user123"),
                "fraud_alert": generate_fraud_alert()
            }
            
            await manager.send_personal_message(json.dumps(data), websocket)
            await asyncio.sleep(10)
            
    except WebSocketDisconnect:
        # Disconnect from all channels
        for channel in manager.active_connections.keys():
            manager.disconnect(websocket, channel)

# HTTP endpoints for WebSocket info
@app.get("/ws/info")
async def websocket_info():
    """Get WebSocket connection information"""
    return {
        "websocket_url": "ws://localhost:3003",
        "available_channels": [
            "/ws/market-data/{symbol}",
            "/ws/trade-signals",
            "/ws/portfolio-updates/{user_id}",
            "/ws/fraud-alerts",
            "/ws/all"
        ],
        "active_connections": {
            channel: len(connections) 
            for channel, connections in manager.active_connections.items()
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "websocket",
        "timestamp": datetime.now(timezone.utc),
        "active_connections": sum(len(connections) for connections in manager.active_connections.values())
    }

# Background task for broadcasting data
async def broadcast_data():
    """Background task to broadcast data to all connected clients"""
    while True:
        try:
            # Broadcast market data
            market_data = generate_market_data("AAPL")
            await manager.broadcast_to_channel(
                json.dumps(market_data), 
                "market_data"
            )
            
            # Broadcast trade signals
            trade_signal = generate_trade_signal("AAPL")
            await manager.broadcast_to_channel(
                json.dumps(trade_signal), 
                "trade_signals"
            )
            
            # Broadcast portfolio updates
            portfolio_update = generate_portfolio_update("user123")
            await manager.broadcast_to_channel(
                json.dumps(portfolio_update), 
                "portfolio_updates"
            )
            
            # Broadcast fraud alerts (less frequently)
            if datetime.now().second % 30 == 0:
                fraud_alert = generate_fraud_alert()
                await manager.broadcast_to_channel(
                    json.dumps(fraud_alert), 
                    "fraud_alerts"
                )
            
            await asyncio.sleep(5)
            
        except Exception as e:
            logger.error(f"Error in broadcast task: {str(e)}")
            await asyncio.sleep(5)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Start background tasks on startup"""
    asyncio.create_task(broadcast_data())
    logger.info("WebSocket server started")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("WebSocket server shutting down")

if __name__ == "__main__":
    uvicorn.run(
        "websocket_server:app",
        host="0.0.0.0",
        port=3003,
        reload=True,
        log_level="info"
    )
