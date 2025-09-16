"""Configuration management for the trading ML algorithm."""

import os
from typing import Dict, Any, Optional
from pydantic_settings import BaseSettings
from pydantic import Field
from enum import Enum


class ModelType(str, Enum):
    """Supported model types."""
    TFT = "tft"
    LSTM_ATTN = "lstm_attn"
    PPO = "ppo"
    NAIVE = "naive"


class AssetClass(str, Enum):
    """Supported asset classes."""
    EQUITY = "EQUITY"
    FX = "FX"
    CRYPTO = "CRYPTO"
    COMMODITY = "COMMODITY"
    BOND = "BOND"


class BrokerType(str, Enum):
    """Supported broker types."""
    ALPACA = "alpaca"
    INTERACTIVE_BROKERS = "interactive_brokers"
    OANDA = "oanda"
    BINANCE = "binance"
    KRAKEN = "kraken"


class Settings(BaseSettings):
    """Application settings."""

    # Model configuration
    model_type: ModelType = Field(
        default=ModelType.TFT,
        description="Primary model type")
    model_bucket: str = Field(
        default="trading-models",
        description="S3 bucket for models")
    model_prefix: str = Field(
        default="models/",
        description="S3 prefix for models")

    # Training configuration
    lookback_window: int = Field(default=1024,
                                 description="Lookback window for models")
    prediction_horizon: int = Field(
        default=1, description="Prediction horizon in minutes")
    batch_size: int = Field(default=32, description="Training batch size")
    learning_rate: float = Field(default=1e-3, description="Learning rate")
    max_epochs: int = Field(default=100, description="Maximum training epochs")
    early_stopping_patience: int = Field(
        default=20, description="Early stopping patience")

    # TFT specific
    tft_hidden_size: int = Field(default=128, description="TFT hidden size")
    tft_num_heads: int = Field(default=4, description="TFT attention heads")
    tft_dropout: float = Field(default=0.1, description="TFT dropout rate")
    tft_quantiles: list = Field(
        default=[
            0.1,
            0.5,
            0.9],
        description="TFT quantiles")

    # LSTM specific
    lstm_hidden_size: int = Field(default=128, description="LSTM hidden size")
    lstm_num_layers: int = Field(default=2, description="LSTM layers")
    lstm_dropout: float = Field(default=0.2, description="LSTM dropout rate")

    # PPO specific
    ppo_clip_ratio: float = Field(default=0.2, description="PPO clip ratio")
    ppo_entropy_coef: float = Field(
        default=0.01, description="PPO entropy coefficient")
    ppo_value_coef: float = Field(
        default=0.5, description="PPO value coefficient")
    ppo_max_grad_norm: float = Field(
        default=0.5, description="PPO max gradient norm")
    ppo_gae_lambda: float = Field(default=0.95, description="PPO GAE lambda")

    # Risk management
    max_position_size: float = Field(
        default=10000.0,
        description="Maximum position size")
    stop_loss_pct: float = Field(
        default=2.0, description="Stop loss percentage")
    take_profit_pct: float = Field(
        default=4.0, description="Take profit percentage")
    risk_free_rate: float = Field(default=0.02, description="Risk-free rate")

    # Data configuration
    data_source: str = Field(default="yfinance", description="Data source")
    symbols: list = Field(
        default=[
            "AAPL",
            "MSFT",
            "GOOGL"],
        description="Trading symbols")
    timeframe: str = Field(default="1m", description="Data timeframe")

    # Broker configuration
    broker_type: BrokerType = Field(
        default=BrokerType.ALPACA,
        description="Broker type")
    broker_api_key: Optional[str] = Field(
        default=None, description="Broker API key")
    broker_secret_key: Optional[str] = Field(
        default=None, description="Broker secret key")
    broker_sandbox: bool = Field(
        default=True, description="Use broker sandbox")

    # AWS configuration
    aws_region: str = Field(default="us-east-1", description="AWS region")
    aws_access_key_id: Optional[str] = Field(
        default=None, description="AWS access key")
    aws_secret_access_key: Optional[str] = Field(
        default=None, description="AWS secret key")

    # Redis configuration
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_db: int = Field(default=0, description="Redis database")

    # API configuration
    inference_port: int = Field(
        default=8000,
        description="Inference service port")
    engine_port: int = Field(default=8001, description="Engine service port")
    api_host: str = Field(default="0.0.0.0", description="API host")

    # Logging
    log_level: str = Field(default="INFO", description="Log level")
    log_format: str = Field(default="json", description="Log format")

    # Feature engineering
    technical_indicators: list = Field(
        default=["RSI", "MACD", "BB", "ATR", "SMA", "EMA"],
        description="Technical indicators to use"
    )
    feature_window: int = Field(default=20, description="Feature window size")

    # Validation
    validation_split: float = Field(
        default=0.2, description="Validation split")
    test_split: float = Field(default=0.1, description="Test split")

    # Deployment
    dry_run: bool = Field(default=True, description="Dry run mode")
    max_concurrent_trades: int = Field(
        default=5, description="Max concurrent trades")

    # Additional environment fields
    environment: str = Field(default="development", description="Environment")
    debug: bool = Field(default=False, description="Debug mode")
    aws_account_id: str = Field(default="", description="AWS Account ID")
    dynamodb_endpoint: str = Field(default="", description="DynamoDB endpoint")
    redis_endpoint: str = Field(default="", description="Redis endpoint")

    # Broker API keys
    alpaca_api_key: str = Field(default="", description="Alpaca API key")
    alpaca_secret_key: str = Field(default="", description="Alpaca secret key")
    alpaca_base_url: str = Field(default="", description="Alpaca base URL")
    binance_api_key: str = Field(default="", description="Binance API key")
    binance_secret_key: str = Field(
        default="", description="Binance secret key")
    binance_base_url: str = Field(default="", description="Binance base URL")
    oanda_api_key: str = Field(default="", description="OANDA API key")
    oanda_secret_key: str = Field(default="", description="OANDA secret key")
    oanda_base_url: str = Field(default="", description="OANDA base URL")

    # Service endpoints
    model_registry_url: str = Field(
        default="", description="Model registry URL")
    inference_endpoint: str = Field(
        default="", description="Inference endpoint")
    sentry_dsn: str = Field(default="", description="Sentry DSN")

    model_config = {
        "extra": "allow",  # Allow extra fields
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


# Global settings instance
settings = Settings()


def get_model_config(model_type: ModelType) -> Dict[str, Any]:
    """Get model-specific configuration."""
    configs = {
        ModelType.TFT: {
            "hidden_size": settings.tft_hidden_size,
            "num_heads": settings.tft_num_heads,
            "dropout": settings.tft_dropout,
            "quantiles": settings.tft_quantiles,
            "lookback_window": settings.lookback_window,
            "prediction_horizon": settings.prediction_horizon,
        },
        ModelType.LSTM_ATTN: {
            "hidden_size": settings.lstm_hidden_size,
            "num_layers": settings.lstm_num_layers,
            "dropout": settings.lstm_dropout,
            "lookback_window": settings.lookback_window,
            "prediction_horizon": settings.prediction_horizon,
        },
        ModelType.PPO: {
            "clip_ratio": settings.ppo_clip_ratio,
            "entropy_coef": settings.ppo_entropy_coef,
            "value_coef": settings.ppo_value_coef,
            "max_grad_norm": settings.ppo_max_grad_norm,
            "gae_lambda": settings.ppo_gae_lambda,
            "learning_rate": settings.learning_rate,
        },
        ModelType.NAIVE: {
            "lookback_window": settings.lookback_window,
            "prediction_horizon": settings.prediction_horizon,
        }
    }

    return configs.get(model_type, {})


def get_risk_config() -> Dict[str, Any]:
    """Get risk management configuration."""
    return {
        "max_position_size": settings.max_position_size,
        "stop_loss_pct": settings.stop_loss_pct,
        "take_profit_pct": settings.take_profit_pct,
        "risk_free_rate": settings.risk_free_rate,
        "max_concurrent_trades": settings.max_concurrent_trades,
    }


def get_data_config() -> Dict[str, Any]:
    """Get data configuration."""
    return {
        "data_source": settings.data_source,
        "symbols": settings.symbols,
        "timeframe": settings.timeframe,
        "technical_indicators": settings.technical_indicators,
        "feature_window": settings.feature_window,
        "validation_split": settings.validation_split,
        "test_split": settings.test_split,
    }
