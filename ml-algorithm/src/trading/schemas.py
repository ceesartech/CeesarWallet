"""Data schemas for the trading ML algorithm."""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field, field_validator
import pandas as pd
import numpy as np


class Side(str, Enum):
    """Trading side."""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class OrderType(str, Enum):
    """Order type."""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"
    STOP_LIMIT = "STOP_LIMIT"
    BRACKET = "BRACKET"


class AssetClass(str, Enum):
    """Asset class."""
    EQUITY = "EQUITY"
    FX = "FX"
    CRYPTO = "CRYPTO"
    COMMODITY = "COMMODITY"
    BOND = "BOND"


class ExecutionStatus(str, Enum):
    """Execution status."""
    PENDING = "PENDING"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class MarketData(BaseModel):
    """Market data point."""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    asset_class: AssetClass

    @field_validator('timestamp')
    @classmethod
    def validate_timestamp(cls, v):
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v


class TechnicalIndicators(BaseModel):
    """Technical indicators."""
    symbol: str
    timestamp: datetime
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    atr: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    volume_sma: Optional[float] = None
    volatility: Optional[float] = None


class Forecast(BaseModel):
    """Model forecast."""
    symbol: str
    timestamp: datetime
    forecast: float
    ci_low: float
    ci_high: float
    confidence: float
    model_name: str
    horizon: int  # minutes
    features: Dict[str, float] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator('confidence')
    @classmethod
    def validate_confidence(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Confidence must be between 0 and 1')
        return v


class TradeSignal(BaseModel):
    """Trading signal."""
    symbol: str
    side: Side
    quantity: float
    price: Optional[float] = None
    order_type: OrderType = OrderType.MARKET
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    confidence: float = Field(default=1.0, ge=0, le=1)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc))
    model_name: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v, info):
        if v < 0:
            raise ValueError('Quantity must be non-negative')
        # Allow 0 quantity for HOLD actions
        if v == 0 and info.data.get('side') == Side.HOLD:
            return v
        if v <= 0:
            raise ValueError('Quantity must be positive for non-HOLD actions')
        return v


class TradeExecution(BaseModel):
    """Trade execution."""
    signal: TradeSignal
    execution_id: str
    executed_price: float
    executed_quantity: float
    execution_time: datetime
    fees: float
    status: ExecutionStatus
    broker_order_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Position(BaseModel):
    """Trading position."""
    symbol: str
    quantity: float
    average_price: float
    unrealized_pnl: float
    realized_pnl: float
    market_value: float
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc))


class PerformanceMetrics(BaseModel):
    """Performance metrics."""
    symbol: str
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    avg_trade_duration: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc))


class ModelMetrics(BaseModel):
    """Model performance metrics."""
    model_name: str
    symbol: str
    rmse: float
    mae: float
    mape: float
    directional_accuracy: float
    coverage: float
    sharp_ratio: float
    max_drawdown: float
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc))


class TrainingConfig(BaseModel):
    """Training configuration."""
    model_type: str
    lookback_window: int
    prediction_horizon: int
    batch_size: int
    learning_rate: float
    max_epochs: int
    early_stopping_patience: int
    validation_split: float
    test_split: float
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)


class InferenceRequest(BaseModel):
    """Inference request."""
    symbol: str
    horizon: int = 1
    include_features: bool = False
    model_name: Optional[str] = None


class InferenceResponse(BaseModel):
    """Inference response."""
    symbol: str
    forecast: float
    ci_low: float
    ci_high: float
    confidence: float
    model_name: str
    horizon: int
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc))
    features: Dict[str, float] = Field(default_factory=dict)


class BatchInferenceRequest(BaseModel):
    """Batch inference request."""
    symbols: List[str]
    horizon: int = 1
    include_features: bool = False
    model_name: Optional[str] = None


class BatchInferenceResponse(BaseModel):
    """Batch inference response."""
    forecasts: Dict[str, InferenceResponse]
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc))


class ModelStatus(BaseModel):
    """Model status."""
    model_name: str
    version: str
    is_active: bool
    accuracy: Optional[float] = None
    last_trained: Optional[datetime] = None
    latency: float
    memory_usage: float
    cpu_usage: float


class SystemHealth(BaseModel):
    """System health status."""
    status: str  # HEALTHY, DEGRADED, DOWN
    components: Dict[str, ModelStatus]
    last_check: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc))
    uptime: str


class Transaction(BaseModel):
    """Transaction data for fraud detection."""
    user_id: str
    amount: float
    timestamp: datetime
    ip_address: str
    device_id: str
    location: str
    merchant_category: str


class FraudRiskLevel(str, Enum):
    """Fraud risk levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudType(str, Enum):
    """Types of fraud."""
    UNKNOWN = "unknown"
    ACCOUNT_TAKEOVER = "account_takeover"
    PAYMENT_FRAUD = "payment_fraud"
    MONEY_LAUNDERING = "money_laundering"
    INSIDER_TRADING = "insider_trading"


class FraudScore(BaseModel):
    """Fraud detection result."""
    signal_id: str
    score: float
    risk_level: FraudRiskLevel
    is_fraudulent: bool
    confidence: float
    fraud_type: Optional[FraudType] = None
    metadata: Optional[Dict[str, Any]] = None


def market_data_to_dataframe(data: List[MarketData]) -> pd.DataFrame:
    """Convert market data to pandas DataFrame."""
    records = []
    for item in data:
        records.append({
            'symbol': item.symbol,
            'timestamp': item.timestamp,
            'open': item.open,
            'high': item.high,
            'low': item.low,
            'close': item.close,
            'volume': item.volume,
            'asset_class': item.asset_class.value
        })

    df = pd.DataFrame(records)
    df.set_index('timestamp', inplace=True)
    return df


def technical_indicators_to_dataframe(
        data: List[TechnicalIndicators]) -> pd.DataFrame:
    """Convert technical indicators to pandas DataFrame."""
    records = []
    for item in data:
        record = {
            'symbol': item.symbol,
            'timestamp': item.timestamp,
            'rsi': item.rsi,
            'macd': item.macd,
            'macd_signal': item.macd_signal,
            'macd_histogram': item.macd_histogram,
            'bb_upper': item.bb_upper,
            'bb_middle': item.bb_middle,
            'bb_lower': item.bb_lower,
            'atr': item.atr,
            'sma_20': item.sma_20,
            'sma_50': item.sma_50,
            'ema_12': item.ema_12,
            'ema_26': item.ema_26,
            'volume_sma': item.volume_sma,
            'volatility': item.volatility
        }
        records.append(record)

    df = pd.DataFrame(records)
    df.set_index('timestamp', inplace=True)
    return df


def create_feature_matrix(
    market_data: pd.DataFrame,
    technical_indicators: pd.DataFrame
) -> np.ndarray:
    """Create feature matrix from market data and technical indicators."""
    # Merge market data and technical indicators
    df = market_data.join(technical_indicators, how='inner')

    # Select numeric columns for features
    feature_columns = [
        'open', 'high', 'low', 'close', 'volume',
        'rsi', 'macd', 'macd_signal', 'macd_histogram',
        'bb_upper', 'bb_middle', 'bb_lower', 'atr',
        'sma_20', 'sma_50', 'ema_12', 'ema_26',
        'volume_sma', 'volatility'
    ]

    # Filter available columns
    available_columns = [col for col in feature_columns if col in df.columns]

    # Create feature matrix
    features = df[available_columns].values

    # Handle NaN values
    features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)

    return features
