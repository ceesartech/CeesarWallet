"""FastAPI inference service for ML models."""

import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import numpy as np
from datetime import datetime, timezone
import redis
import json
from contextlib import asynccontextmanager

from trading.config import settings, ModelType
from trading.schemas import InferenceRequest, InferenceResponse, BatchInferenceRequest, BatchInferenceResponse
from trading.logging_utils import setup_logging, get_logger, model_logger
from trading.model_registry import model_registry
from trading.data.market_data import MarketDataManager
from trading.data.technical_indicators import TechnicalIndicatorsCalculator
from trading.predictors.tft import TemporalFusionTransformer
from trading.predictors.lstm_attn import ProductionLSTM as LSTMAttentionPredictor
from trading.predictors.naive import NaivePredictor

# Setup logging
setup_logging()
logger = get_logger("trading.inference")

# Global model cache
model_cache: Dict[str, Any] = {}
redis_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global redis_client

    # Startup
    logger.info("Starting inference service")

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

    # Load models
    await load_models()

    yield

    # Shutdown
    logger.info("Shutting down inference service")


app = FastAPI(
    title="Trading ML Inference Service",
    description="ML model inference service for trading predictions",
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


async def load_models():
    """Load all available models."""
    try:
        logger.info("Loading models from registry")

        # Get available models
        models = model_registry.list_models()

        for model_metadata in models:
            try:
                # Load model
                model, metadata = model_registry.load_model(
                    model_metadata.model_name,
                    model_metadata.version,
                    model_metadata.symbol
                )

                # Create predictor instance
                predictor = create_predictor(
                    metadata.model_type, model_metadata.symbol, model)

                # Cache model
                cache_key = f"{
                    model_metadata.symbol}_{
                    model_metadata.model_name}"
                model_cache[cache_key] = predictor

                logger.info(
                    "Model loaded successfully",
                    model_name=model_metadata.model_name,
                    symbol=model_metadata.symbol,
                    version=model_metadata.version
                )

            except Exception as e:
                logger.error(
                    "Failed to load model",
                    model_name=model_metadata.model_name,
                    symbol=model_metadata.symbol,
                    error=str(e)
                )

        logger.info(f"Loaded {len(model_cache)} models")

    except Exception as e:
        logger.error(f"Failed to load models: {e}")


def create_predictor(model_type: str, symbol: str, model: Any):
    """Create predictor instance based on model type."""
    config = {
        'lookback_window': settings.lookback_window,
        'prediction_horizon': settings.prediction_horizon,
        'hidden_size': settings.tft_hidden_size,
        'num_heads': settings.tft_num_heads,
        'dropout': settings.tft_dropout,
        'quantiles': settings.tft_quantiles
    }

    if model_type == ModelType.TFT:
        predictor = TemporalFusionTransformer(f"tft_{symbol}", symbol, config)
    elif model_type == ModelType.LSTM_ATTN:
        predictor = LSTMAttentionPredictor(f"lstm_{symbol}", symbol, config)
    elif model_type == ModelType.NAIVE:
        predictor = NaivePredictor(f"naive_{symbol}", symbol, config)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    # Set the loaded model
    predictor.model = model
    predictor.is_trained = True

    return predictor


async def get_latest_data(symbol: str, lookback_window: int) -> tuple:
    """Get latest market data and technical indicators."""
    try:
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=lookback_window)

        # Get market data
        market_data = await data_manager.get_historical_data(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            timeframe=settings.timeframe
        )

        if not market_data:
            raise ValueError(f"No market data available for {symbol}")

        # Calculate technical indicators
        technical_indicators = indicators_calculator.calculate_all_indicators(
            market_data, symbol
        )

        return market_data, technical_indicators

    except Exception as e:
        logger.error(f"Failed to get data for {symbol}: {e}")
        raise


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models_loaded": len(model_cache),
        "redis_connected": redis_client is not None
    }


@app.post("/forecast", response_model=InferenceResponse)
async def get_forecast(request: InferenceRequest):
    """Get forecast for a single symbol."""
    try:
        # Check cache first
        cache_key = f"forecast_{request.symbol}_{request.horizon}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                cached_data = json.loads(cached_result)
                return InferenceResponse(**cached_data)

        # Get latest data
        market_data, technical_indicators = await get_latest_data(
            request.symbol, settings.lookback_window
        )

        # Find best model for symbol
        best_predictor = None
        best_model_name = None

        for cache_key, predictor in model_cache.items():
            if request.symbol in cache_key:
                if best_predictor is None or predictor.confidence > getattr(
                        best_predictor, 'confidence', 0):
                    best_predictor = predictor
                    best_model_name = predictor.model_name

        if best_predictor is None:
            raise HTTPException(
                status_code=404,
                detail=f"No trained model found for symbol {request.symbol}"
            )

        # Prepare features
        X, _ = best_predictor.prepare_features(
            market_data, technical_indicators)

        if len(X) == 0:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data for prediction"
            )

        # Make prediction
        prediction, confidence = best_predictor.predict(
            X[-1:], return_confidence=True
        )

        if len(prediction) == 0:
            raise HTTPException(
                status_code=500,
                detail="Prediction failed"
            )

        # Create response
        response = InferenceResponse(
            symbol=request.symbol,
            forecast=float(prediction[0]),
            ci_low=float(
                confidence[0][0]) if confidence is not None else float(
                prediction[0]),
            ci_high=float(
                confidence[0][1]) if confidence is not None else float(
                prediction[0]),
            confidence=0.8,  # Placeholder confidence
            model_name=best_model_name,
            horizon=request.horizon,
            timestamp=datetime.now(timezone.utc),
            features={} if not request.include_features else {}
        )

        # Cache result
        if redis_client:
            redis_client.setex(
                cache_key,
                300,  # 5 minutes
                json.dumps(response.dict())
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forecast error for {request.symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/forecast/batch", response_model=BatchInferenceResponse)
async def get_batch_forecasts(request: BatchInferenceRequest):
    """Get forecasts for multiple symbols."""
    try:
        forecasts = {}

        # Process symbols concurrently
        tasks = []
        for symbol in request.symbols:
            task = get_forecast(InferenceRequest(
                symbol=symbol,
                horizon=request.horizon,
                include_features=request.include_features
            ))
            tasks.append((symbol, task))

        # Wait for all predictions
        for symbol, task in tasks:
            try:
                forecast = await task
                forecasts[symbol] = forecast
            except Exception as e:
                logger.error(f"Batch forecast error for {symbol}: {e}")
                # Continue with other symbols

        return BatchInferenceResponse(
            forecasts=forecasts,
            timestamp=datetime.now(timezone.utc)
        )

    except Exception as e:
        logger.error(f"Batch forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status")
async def get_model_status():
    """Get model status information."""
    try:
        status = {
            "is_healthy": True,
            "models": [],
            "last_update": datetime.now(timezone.utc).isoformat(),
            "latency": 0
        }

        for cache_key, predictor in model_cache.items():
            model_info = predictor.get_model_info()
            status["models"].append({
                "name": model_info["model_name"],
                "version": "1.0",  # Placeholder
                "is_active": model_info["is_trained"],
                "accuracy": None,
                "last_trained": None
            })

        return status

    except Exception as e:
        logger.error(f"Status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/reload")
async def reload_models(background_tasks: BackgroundTasks):
    """Reload all models from registry."""
    try:
        background_tasks.add_task(load_models)
        return {"message": "Model reload initiated"}

    except Exception as e:
        logger.error(f"Model reload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models")
async def list_models():
    """List all available models."""
    try:
        models = []
        for cache_key, predictor in model_cache.items():
            model_info = predictor.get_model_info()
            models.append({
                "name": model_info["model_name"],
                "symbol": model_info["symbol"],
                "is_trained": model_info["is_trained"],
                "feature_count": model_info["feature_count"]
            })

        return {"models": models}

    except Exception as e:
        logger.error(f"List models error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "inference_service:app",
        host=settings.api_host,
        port=settings.inference_port,
        reload=True,
        log_level=settings.log_level.lower()
    )
