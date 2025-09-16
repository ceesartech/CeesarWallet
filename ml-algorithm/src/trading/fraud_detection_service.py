"""FastAPI fraud detection service."""

import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import numpy as np
from datetime import datetime, timezone
import redis
import json
from contextlib import asynccontextmanager

from trading.config import settings
from trading.schemas import Transaction, FraudScore, FraudRiskLevel
from trading.logging_utils import get_logger
from trading.fraud_detection import ProductionFraudDetectionService

# Initialize logger
logger = get_logger("trading.fraud_detection")

# Global state
redis_client = None
fraud_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global redis_client, fraud_service

    # Startup
    logger.info("Starting fraud detection service")

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

    # Initialize fraud detection service
    fraud_service = ProductionFraudDetectionService()

    yield

    # Shutdown
    logger.info("Shutting down fraud detection service")


app = FastAPI(
    title="Fraud Detection Service",
    description="Real-time fraud detection for trading transactions",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FraudDetectionRequest(BaseModel):
    """Request model for fraud detection."""
    transaction: Dict[str, Any]
    user_id: str
    additional_data: Optional[Dict[str, Any]] = None


class FraudDetectionResponse(BaseModel):
    """Response model for fraud detection."""
    fraud_score: float
    risk_level: str
    is_fraudulent: bool
    confidence: float
    fraud_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "fraud_detection",
        "timestamp": datetime.now(timezone.utc),
        "redis_connected": redis_client is not None
    }


@app.post("/detect", response_model=FraudDetectionResponse)
async def detect_fraud(request: FraudDetectionRequest):
    """Detect fraud in a transaction."""
    try:
        if not fraud_service:
            raise HTTPException(status_code=503, detail="Fraud detection service not initialized")

        # Create transaction object
        transaction = Transaction(
            user_id=request.user_id,
            amount=request.transaction.get("amount", 0.0),
            timestamp=datetime.now(timezone.utc),
            ip_address=request.transaction.get("ip_address", "127.0.0.1"),
            device_id=request.transaction.get("device_id", "unknown"),
            location=request.transaction.get("location", "unknown"),
            merchant_category=request.transaction.get("merchant_category", "unknown")
        )

        # Detect fraud
        fraud_score = await fraud_service.detect_fraud(transaction)

        return FraudDetectionResponse(
            fraud_score=fraud_score.score,
            risk_level=fraud_score.risk_level.value,
            is_fraudulent=fraud_score.is_fraudulent,
            confidence=fraud_score.confidence,
            fraud_type=fraud_score.fraud_type.value if fraud_score.fraud_type else None,
            metadata=fraud_score.metadata
        )

    except Exception as e:
        logger.error(f"Error in fraud detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect_batch")
async def detect_fraud_batch(requests: List[FraudDetectionRequest]):
    """Detect fraud in multiple transactions."""
    try:
        if not fraud_service:
            raise HTTPException(status_code=503, detail="Fraud detection service not initialized")

        results = []
        for request in requests:
            # Create transaction object
            transaction = Transaction(
                user_id=request.user_id,
                amount=request.transaction.get("amount", 0.0),
                timestamp=datetime.now(timezone.utc),
                ip_address=request.transaction.get("ip_address", "127.0.0.1"),
                device_id=request.transaction.get("device_id", "unknown"),
                location=request.transaction.get("location", "unknown"),
                merchant_category=request.transaction.get("merchant_category", "unknown")
            )

            # Detect fraud
            fraud_score = await fraud_service.detect_fraud(transaction)

            results.append(FraudDetectionResponse(
                fraud_score=fraud_score.score,
                risk_level=fraud_score.risk_level.value,
                is_fraudulent=fraud_score.is_fraudulent,
                confidence=fraud_score.confidence,
                fraud_type=fraud_score.fraud_type.value if fraud_score.fraud_type else None,
                metadata=fraud_score.metadata
            ))

        return {"results": results}

    except Exception as e:
        logger.error(f"Error in batch fraud detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
async def get_metrics():
    """Get fraud detection metrics."""
    try:
        if not fraud_service:
            raise HTTPException(status_code=503, detail="Fraud detection service not initialized")

        return {
            "total_predictions": fraud_service.total_predictions,
            "aws_predictions": fraud_service.aws_predictions,
            "local_predictions": fraud_service.local_predictions,
            "errors": fraud_service.errors,
            "success_rate": (fraud_service.total_predictions - fraud_service.errors) / max(fraud_service.total_predictions, 1)
        }

    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "fraud_detection_service:app",
        host="0.0.0.0",
        port=5003,
        reload=True,
        log_level="info"
    )
