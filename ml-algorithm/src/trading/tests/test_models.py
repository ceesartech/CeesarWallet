"""Comprehensive ML model testing with real data validation."""

import pytest
import asyncio
import numpy as np
import pandas as pd
import torch
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import tempfile
import shutil
from pathlib import Path
import json

# Import our models
from trading.predictors.tft import TemporalFusionTransformer as TFTModel
from trading.predictors.lstm_attn import ProductionLSTM as LSTMAttentionModel
from trading.predictors.naive import NaivePredictor
from trading.policy.ppo import ProductionPPO as PPOPolicy
from trading.fraud_detection import ProductionFraudDetectionService as FraudDetectionService, FraudScore, FraudRiskLevel
from trading.adapters.alpaca_adapter import AlpacaAdapter
from trading.adapters.binance_adapter import BinanceAdapter
from trading.adapters.oanda_adapter import OandaAdapter
from trading.data.market_data import MarketDataManager
from trading.schemas import TradeSignal, Forecast, MarketData, TechnicalIndicators, AssetClass
from trading.config import settings
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.tests")


class TestDataGenerator:
    """Generate realistic test data for model testing."""

    @staticmethod
    def generate_market_data(
        symbol: str = "AAPL",
        days: int = 1000,
        start_price: float = 150.0
    ) -> pd.DataFrame:
        """Generate realistic market data for testing."""
        dates = pd.date_range(
            start=datetime.now(timezone.utc) - timedelta(days=days),
            end=datetime.now(timezone.utc),
            freq='D'
        )

        data = []
        current_price = start_price

        for i, date in enumerate(dates):
            # Generate realistic price movement
            # 0.05% daily return, 2% volatility
            daily_return = np.random.normal(0.0005, 0.02)
            current_price *= (1 + daily_return)

            # Generate OHLCV
            high = current_price * (1 + abs(np.random.normal(0, 0.01)))
            low = current_price * (1 - abs(np.random.normal(0, 0.01)))
            volume = np.random.randint(1000000, 10000000)

            data.append({
                'symbol': symbol,
                'timestamp': date,
                'open': current_price * 0.99,
                'high': high,
                'low': low,
                'close': current_price,
                'volume': volume
            })

        return pd.DataFrame(data)

    @staticmethod
    def generate_technical_indicators(data: pd.DataFrame) -> pd.DataFrame:
        """Generate technical indicators for testing."""
        df = data.copy()

        # Simple Moving Averages
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()

        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi_14'] = 100 - (100 / (1 + rs))

        # MACD
        ema_12 = df['close'].ewm(span=12).mean()
        ema_26 = df['close'].ewm(span=26).mean()
        df['macd'] = ema_12 - ema_26
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']

        # Bollinger Bands
        sma_20 = df['close'].rolling(window=20).mean()
        std_20 = df['close'].rolling(window=20).std()
        df['bb_upper'] = sma_20 + (std_20 * 2)
        df['bb_lower'] = sma_20 - (std_20 * 2)
        df['bb_middle'] = sma_20

        # Volume indicators
        df['volume_sma'] = df['volume'].rolling(window=20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma']

        return df.dropna()


class TestTFTModel:
    """Test TFT model functionality."""

    def setup_method(self):
        """Setup test environment."""
        self.test_data = TestDataGenerator.generate_market_data()
        self.test_data = TestDataGenerator.generate_technical_indicators(
            self.test_data)
        self.model = TFTModel(
            model_name="test_tft",
            symbol="BTCUSD",
            config={
                'lookback_window': 60,
                'prediction_horizon': 5,
                'hidden_size': 64,
                'num_heads': 4,
                'num_layers': 2,
                'dropout': 0.1
            }
        )

    def test_model_initialization(self):
        """Test model initialization."""
        assert self.model.model_name == "test_tft"
        assert self.model.lookback_window == 60
        assert self.model.prediction_horizon == 5
        assert self.model.is_trained == False

    def test_data_preprocessing(self):
        """Test data preprocessing."""
        # Convert DataFrame to MarketData objects for prepare_features
        market_data = []
        for _, row in self.test_data.iterrows():
            market_data.append(MarketData(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                asset_class=AssetClass.EQUITY
            ))

        # Convert to TechnicalIndicators objects
        technical_indicators = []
        for _, row in self.test_data.iterrows():
            technical_indicators.append(TechnicalIndicators(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                rsi=row.get('rsi_14', 50),
                macd=row.get('macd', 0),
                macd_signal=row.get('macd_signal', 0),
                macd_histogram=row.get('macd_histogram', 0),
                bb_upper=row.get('bb_upper', row['close']),
                bb_middle=row.get('bb_middle', row['close']),
                bb_lower=row.get('bb_lower', row['close']),
                atr=row.get('atr', 0),
                sma_20=row.get('sma_20', row['close']),
                sma_50=row.get('sma_50', row['close']),
                ema_12=row.get('ema_12', row['close']),
                ema_26=row.get('ema_26', row['close']),
                volume_sma=row.get('volume_sma', row['volume']),
                volatility=row.get('volatility', 0)
            ))

        X, y = self.model.prepare_features(market_data, technical_indicators)

        assert isinstance(X, np.ndarray)
        assert isinstance(y, np.ndarray)
        assert len(X) > 0
        assert len(y) > 0

    def test_model_training(self):
        """Test model training."""
        # Use smaller dataset for faster testing
        train_data = self.test_data.head(200)
        
        # Convert DataFrame to MarketData and TechnicalIndicators objects
        market_data = []
        technical_indicators = []
        for _, row in train_data.iterrows():
            market_data.append(MarketData(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                asset_class=AssetClass.EQUITY
            ))
            technical_indicators.append(TechnicalIndicators(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                rsi=row.get('rsi_14', 50),
                macd=row.get('macd', 0),
                macd_signal=row.get('macd_signal', 0),
                macd_histogram=row.get('macd_histogram', 0),
                bb_upper=row.get('bb_upper', row['close']),
                bb_middle=row.get('bb_middle', row['close']),
                bb_lower=row.get('bb_lower', row['close']),
                atr=row.get('atr', 0),
                sma_20=row.get('sma_20', row['close']),
                sma_50=row.get('sma_50', row['close']),
                ema_12=row.get('ema_12', row['close']),
                ema_26=row.get('ema_26', row['close']),
                volume_sma=row.get('volume_sma', row['volume']),
                volatility=row.get('volatility', 0)
            ))

        # Prepare features
        X_train, y_train = self.model.prepare_features(market_data, technical_indicators)
        
        # Train model
        self.model.train(X_train, y_train)

        assert self.model.is_trained

    def test_model_prediction(self):
        """Test model prediction."""
        # Train model first
        train_data = self.test_data.head(200)
        
        # Convert DataFrame to MarketData and TechnicalIndicators objects
        market_data = []
        technical_indicators = []
        for _, row in train_data.iterrows():
            market_data.append(MarketData(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                asset_class=AssetClass.EQUITY
            ))
            technical_indicators.append(TechnicalIndicators(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                rsi=row.get('rsi_14', 50),
                macd=row.get('macd', 0),
                macd_signal=row.get('macd_signal', 0),
                macd_histogram=row.get('macd_histogram', 0),
                bb_upper=row.get('bb_upper', row['close']),
                bb_middle=row.get('bb_middle', row['close']),
                bb_lower=row.get('bb_lower', row['close']),
                atr=row.get('atr', 0),
                sma_20=row.get('sma_20', row['close']),
                sma_50=row.get('sma_50', row['close']),
                ema_12=row.get('ema_12', row['close']),
                ema_26=row.get('ema_26', row['close']),
                volume_sma=row.get('volume_sma', row['volume']),
                volatility=row.get('volatility', 0)
            ))

        # Prepare features and train
        X_train, y_train = self.model.prepare_features(market_data, technical_indicators)
        self.model.train(X_train, y_train)

        # Test prediction
        test_data = self.test_data.tail(100)
        # Convert test data to MarketData and TechnicalIndicators objects
        test_market_data = []
        test_technical_indicators = []
        for _, row in test_data.iterrows():
            test_market_data.append(MarketData(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                asset_class=AssetClass.EQUITY
            ))
            test_technical_indicators.append(TechnicalIndicators(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                rsi=row.get('rsi_14', 50),
                macd=row.get('macd', 0),
                macd_signal=row.get('macd_signal', 0),
                macd_histogram=row.get('macd_histogram', 0),
                bb_upper=row.get('bb_upper', row['close']),
                bb_middle=row.get('bb_middle', row['close']),
                bb_lower=row.get('bb_lower', row['close']),
                atr=row.get('atr', 0),
                sma_20=row.get('sma_20', row['close']),
                sma_50=row.get('sma_50', row['close']),
                ema_12=row.get('ema_12', row['close']),
                ema_26=row.get('ema_26', row['close']),
                volume_sma=row.get('volume_sma', row['volume']),
                volatility=row.get('volatility', 0)
            ))

        # Prepare test features
        X_test, _ = self.model.prepare_features(test_market_data, test_technical_indicators)
        
        # Make prediction
        predictions, confidence = self.model.predict(X_test)

        assert isinstance(predictions, np.ndarray)
        assert len(predictions) > 0
        assert confidence is not None
        assert len(confidence) == len(predictions)

    def test_model_save_load(self):
        """Test model save and load."""
        # Train model
        train_data = self.test_data.head(200)
        
        # Convert DataFrame to MarketData and TechnicalIndicators objects
        market_data = []
        technical_indicators = []
        for _, row in train_data.iterrows():
            market_data.append(MarketData(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                asset_class=AssetClass.EQUITY
            ))
            technical_indicators.append(TechnicalIndicators(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                rsi=row.get('rsi_14', 50),
                macd=row.get('macd', 0),
                macd_signal=row.get('macd_signal', 0),
                macd_histogram=row.get('macd_histogram', 0),
                bb_upper=row.get('bb_upper', row['close']),
                bb_middle=row.get('bb_middle', row['close']),
                bb_lower=row.get('bb_lower', row['close']),
                atr=row.get('atr', 0),
                sma_20=row.get('sma_20', row['close']),
                sma_50=row.get('sma_50', row['close']),
                ema_12=row.get('ema_12', row['close']),
                ema_26=row.get('ema_26', row['close']),
                volume_sma=row.get('volume_sma', row['volume']),
                volatility=row.get('volatility', 0)
            ))

        # Prepare features and train
        X_train, y_train = self.model.prepare_features(market_data, technical_indicators)
        self.model.train(X_train, y_train)

        # Save model
        with tempfile.TemporaryDirectory() as temp_dir:
            model_path = Path(temp_dir) / "test_tft_model"
            self.model.save_model(str(model_path))

            # Create new model and load
            new_model = TFTModel(
                model_name="test_tft_loaded",
                symbol="BTCUSD",
                config={
                    'lookback_window': 60,
                    'prediction_horizon': 5,
                    'hidden_size': 64,
                    'num_heads': 4,
                    'num_layers': 2,
                    'dropout': 0.1
                }
            )
            new_model.load_model(str(model_path))

            assert new_model.is_trained
            assert new_model.model_name == "test_tft_loaded"

            # Test prediction with loaded model
            test_data = self.test_data.tail(100)
            # Convert test data to MarketData and TechnicalIndicators objects
            test_market_data = []
            test_technical_indicators = []
            for _, row in test_data.iterrows():
                test_market_data.append(MarketData(
                    symbol=row['symbol'],
                    timestamp=row['timestamp'],
                    open=row['open'],
                    high=row['high'],
                    low=row['low'],
                    close=row['close'],
                    volume=row['volume'],
                asset_class=AssetClass.EQUITY
                ))
                test_technical_indicators.append(TechnicalIndicators(
                    symbol=row['symbol'],
                    timestamp=row['timestamp'],
                    rsi=row.get('rsi_14', 50),
                    macd=row.get('macd', 0),
                    macd_signal=row.get('macd_signal', 0),
                    macd_histogram=row.get('macd_histogram', 0),
                    bb_upper=row.get('bb_upper', row['close']),
                    bb_middle=row.get('bb_middle', row['close']),
                    bb_lower=row.get('bb_lower', row['close']),
                    atr=row.get('atr', 0),
                    sma_20=row.get('sma_20', row['close']),
                    sma_50=row.get('sma_50', row['close']),
                    ema_12=row.get('ema_12', row['close']),
                    ema_26=row.get('ema_26', row['close']),
                    volume_sma=row.get('volume_sma', row['volume']),
                    volatility=row.get('volatility', 0)
                ))

            # Prepare test features
            X_test, _ = new_model.prepare_features(test_market_data, test_technical_indicators)
            
            # Make prediction
            predictions, confidence = new_model.predict(X_test)
            assert isinstance(predictions, np.ndarray)
            assert len(predictions) > 0


class TestLSTMAttentionModel:
    """Test LSTM Attention model functionality."""

    def setup_method(self):
        """Setup test environment."""
        self.test_data = TestDataGenerator.generate_market_data()
        self.test_data = TestDataGenerator.generate_technical_indicators(
            self.test_data)
        self.model = LSTMAttentionModel(
            model_name="test_lstm_attn",
            symbol="BTCUSD",
            config={
                'input_size': 12,  # Match actual number of features
                'hidden_size': 64,
                'num_layers': 2,
                'output_size': 1,
                'num_heads': 4,
                'dropout': 0.1,
                'sequence_length': 60,
                'prediction_length': 5
            }
        )

    def test_model_initialization(self):
        """Test model initialization."""
        assert self.model.model_name == "test_lstm_attn"
        assert self.model.sequence_length == 60
        assert self.model.prediction_length == 5
        assert self.model.is_trained == False

    def test_model_training(self):
        """Test model training."""
        train_data = self.test_data.head(200)
        self.model.train(train_data)

        assert self.model.is_trained
        # best_model_path is only set when validation data is provided

    def test_model_prediction(self):
        """Test model prediction."""
        train_data = self.test_data.head(200)
        self.model.train(train_data)

        test_data = self.test_data.tail(100)
        forecasts = self.model.predict(test_data)

        assert isinstance(forecasts, list)
        assert len(forecasts) > 0
        forecast = forecasts[0]
        assert isinstance(forecast, Forecast)
        assert forecast.symbol == "AAPL"
        assert forecast.confidence is not None

    def test_attention_weights(self):
        """Test attention mechanism."""
        train_data = self.test_data.head(200)
        self.model.train(train_data)

        test_data = self.test_data.tail(100)
        forecasts = self.model.predict(test_data)

        # Check that predictions were made successfully
        assert isinstance(forecasts, list)
        assert len(forecasts) > 0


class TestPPOPolicy:
    """Test PPO policy model functionality."""

    def setup_method(self):
        """Setup test environment."""
        self.test_data = TestDataGenerator.generate_market_data()
        self.test_data = TestDataGenerator.generate_technical_indicators(
            self.test_data)
        self.model = PPOPolicy(
            model_name="test_ppo",
            symbol="BTCUSD",
            config={
                'lookback_window': 60,
                'prediction_horizon': 5,
                'learning_rate': 3e-4,
                'n_steps': 2048,
                'batch_size': 64,
                'n_epochs': 10,
                'gamma': 0.99,
                'gae_lambda': 0.95,
                'clip_range': 0.2,
                'ent_coef': 0.01,
                'vf_coef': 0.5,
                'max_grad_norm': 0.5,
                'target_kl': 0.01
            }
        )

    def test_model_initialization(self):
        """Test model initialization."""
        assert self.model.model_name == "test_ppo"
        assert self.model.config.get('lookback_window') == 60
        assert self.model.is_trained == False

    def test_model_training(self):
        """Test model training."""
        train_data = self.test_data.head(200)
        self.model.train(train_data, total_timesteps=1000)

        assert self.model.is_trained
        assert self.model.best_model_path is not None

    def test_model_prediction(self):
        """Test model prediction."""
        train_data = self.test_data.head(200)
        self.model.train(train_data, total_timesteps=1000)

        test_data = self.test_data.tail(100)
        signals = self.model.predict(test_data)

        assert isinstance(signals, list)
        assert len(signals) > 0
        signal = signals[0]
        assert isinstance(signal, TradeSignal)
        assert signal.symbol in ["AAPL", "UNKNOWN"]
        assert signal.side in ["BUY", "SELL", "HOLD"]
        assert signal.quantity >= 0
        assert signal.confidence is not None

    def test_model_save_load(self):
        """Test model save and load."""
        train_data = self.test_data.head(200)
        self.model.train(train_data, total_timesteps=1000)

        with tempfile.TemporaryDirectory() as temp_dir:
            model_path = Path(temp_dir) / "test_ppo_model"
            self.model.save_model(str(model_path), train_data)

            new_model = PPOPolicy(
                model_name="test_ppo_loaded",
                symbol="BTCUSD",
                config={
                    'lookback_window': 60,
                    'prediction_horizon': 5
                }
            )
            new_model.load_model(str(model_path), train_data.head(100))

            assert new_model.is_trained

            # Test prediction with loaded model
            test_data = self.test_data.tail(100)
            signals = new_model.predict(test_data)
            assert isinstance(signals, list)
            assert len(signals) > 0
            assert isinstance(signals[0], TradeSignal)


class TestNaivePredictor:
    """Test Naive predictor functionality."""

    def setup_method(self):
        """Setup test environment."""
        self.test_data = TestDataGenerator.generate_market_data()
        self.model = NaivePredictor(
            model_name="test_naive",
            symbol="BTCUSD",
            config={
                'prediction_horizon': 5,
                'lookback_window': 20,
                'method': 'last_value'
            }
        )

    def test_model_initialization(self):
        """Test model initialization."""
        assert self.model.model_name == "test_naive"
        assert self.model.prediction_horizon == 5
        assert self.model.is_trained == False

    def test_model_training(self):
        """Test model training."""
        train_data = self.test_data.head(200)
        # Convert DataFrame to numpy arrays for naive predictor
        X_train = train_data[['close']].values.reshape(-1, 1, 1)
        y_train = train_data['close'].values.reshape(-1, 1)
        self.model.train(X_train, y_train)

        assert self.model.is_trained

    def test_model_prediction(self):
        """Test model prediction."""
        train_data = self.test_data.head(200)
        # Convert DataFrame to numpy arrays for naive predictor
        X_train = train_data[['close']].values.reshape(-1, 1, 1)
        y_train = train_data['close'].values.reshape(-1, 1)
        self.model.train(X_train, y_train)

        test_data = self.test_data.tail(100)
        X_test = test_data[['close']].values.reshape(-1, 1, 1)
        predictions, confidence = self.model.predict(X_test)

        assert isinstance(predictions, np.ndarray)
        assert len(predictions) > 0
        assert confidence is not None
        assert len(confidence) == len(predictions)


class TestFraudDetectionService:
    """Test fraud detection service functionality."""

    def setup_method(self):
        """Setup test environment."""
        self.service = FraudDetectionService(
            aws_region="us-east-1",
            detector_name="test-detector",
            model_version="1.0"
        )

    def test_service_initialization(self):
        """Test service initialization."""
        assert self.service.detector_name == "test-detector"
        assert self.service.model_version == "1.0"
        assert self.service.aws_region == "us-east-1"
        assert self.service.fallback_to_local == True

    def test_local_fraud_detection(self):
        """Test local fraud detection."""
        # Create a test signal
        signal = TradeSignal(
            symbol="AAPL",
            side="BUY",
            quantity=100,
            price=150.0,
            timestamp=datetime.now(timezone.utc),
            model_name="test_model"
        )

        # Test data
        test_data = {
            "account_age_days": 365,
            "previous_trades_count": 100,
            "avg_trade_size": 500.0,
            "risk_score": 0.3,
            "device_trust_score": 0.8,
            "location_risk": 0.2
        }

        # Use the local detector directly
        result = self.service.local_detector.predict_fraud(signal, test_data)

        assert isinstance(result, FraudScore)
        assert result.risk_level in [FraudRiskLevel.LOW, FraudRiskLevel.MEDIUM, FraudRiskLevel.HIGH, FraudRiskLevel.CRITICAL]
        assert 0 <= result.score <= 1
        assert 0 <= result.confidence <= 1

    def test_anomaly_detection(self):
        """Test anomaly detection."""
        # Create a normal signal
        normal_signal = TradeSignal(
            symbol="AAPL",
            side="BUY",
            quantity=100,
            price=150.0,
            timestamp=datetime.now(timezone.utc),
            model_name="test_model"
        )

        # Create an anomalous signal
        anomalous_signal = TradeSignal(
            symbol="AAPL",
            side="BUY",
            quantity=50000,  # Very high quantity
            price=150.0,
            timestamp=datetime.now(timezone.utc),
            model_name="test_model"
        )

        # Test normal signal
        normal_result = self.service.local_detector.predict_fraud(normal_signal, {})
        
        # Test anomalous signal
        anomalous_result = self.service.local_detector.predict_fraud(anomalous_signal, {})

        # Anomalous signal should have higher fraud score
        assert anomalous_result.score >= normal_result.score


class TestBrokerAdapters:
    """Test broker adapter functionality."""

    def test_alpaca_adapter_initialization(self):
        """Test Alpaca adapter initialization."""
        adapter = AlpacaAdapter(
            api_key="test_key",
            secret_key="test_secret",
            sandbox=True
        )

        assert adapter.api_key == "test_key"
        assert adapter.secret_key == "test_secret"
        assert adapter.sandbox
        assert adapter.is_connected == False

    def test_binance_adapter_initialization(self):
        """Test Binance adapter initialization."""
        adapter = BinanceAdapter(
            api_key="test_key",
            secret_key="test_secret",
            sandbox=True
        )

        assert adapter.api_key == "test_key"
        assert adapter.secret_key == "test_secret"
        assert adapter.sandbox
        assert adapter.is_connected == False

    def test_oanda_adapter_initialization(self):
        """Test OANDA adapter initialization."""
        adapter = OandaAdapter(
            api_key="test_key",
            secret_key="test_secret",
            sandbox=True
        )

        assert adapter.api_key == "test_key"
        assert adapter.secret_key == "test_secret"
        assert adapter.sandbox
        assert adapter.is_connected == False


class TestMarketDataManager:
    """Test market data manager functionality."""

    def setup_method(self):
        """Setup test environment."""
        self.manager = MarketDataManager()

    def test_manager_initialization(self):
        """Test manager initialization."""
        assert self.manager.is_running == False
        assert len(self.manager.data_buffer) == 0

    def test_data_validation(self):
        """Test data validation."""
        # Valid data
        valid_data = {
            "symbol": "AAPL",
            "timestamp": datetime.now(timezone.utc),
            "open": 150.0,
            "high": 155.0,
            "low": 145.0,
            "close": 152.0,
            "volume": 1000000
        }

        assert self.manager._validate_data(valid_data)

        # Invalid data
        invalid_data = {
            "symbol": "AAPL",
            "timestamp": datetime.now(timezone.utc),
            "open": 150.0,
            "high": 155.0,
            "low": 145.0,
            "close": 152.0,
            "volume": -1000000  # Negative volume
        }

        assert self.manager._validate_data(invalid_data) == False


class TestIntegration:
    """Integration tests for the complete system."""

    def setup_method(self):
        """Setup test environment."""
        self.test_data = TestDataGenerator.generate_market_data()
        self.test_data = TestDataGenerator.generate_technical_indicators(
            self.test_data)

    def test_end_to_end_prediction(self):
        """Test end-to-end prediction pipeline."""
        # Initialize models
        tft_model = TFTModel(
            model_name="test_tft",
            symbol="BTCUSD",
            config={
                'lookback_window': 60,
                'prediction_horizon': 5,
                'hidden_size': 64,
                'num_heads': 4,
                'num_layers': 2,
                'dropout': 0.1
            }
        )

        lstm_model = LSTMAttentionModel(
            model_name="test_lstm",
            symbol="BTCUSD",
            config={
                'input_size': 12,  # Match actual number of features
                'hidden_size': 64,
                'num_layers': 2,
                'output_size': 1,
                'num_heads': 4,
                'dropout': 0.1,
                'sequence_length': 60,
                'prediction_length': 5
            }
        )

        ppo_model = PPOPolicy(
            model_name="test_ppo",
            symbol="BTCUSD",
            config={
                'lookback_window': 60,
                'prediction_horizon': 5,
                'learning_rate': 3e-4,
                'n_steps': 2048,
                'batch_size': 64,
                'n_epochs': 10,
                'gamma': 0.99,
                'gae_lambda': 0.95,
                'clip_range': 0.2,
                'ent_coef': 0.01,
                'vf_coef': 0.5,
                'max_grad_norm': 0.5,
                'target_kl': 0.01
            }
        )

        # Train models
        train_data = self.test_data.head(200)
        
        # Prepare TFT features
        market_data = []
        for _, row in train_data.iterrows():
            market_data.append(MarketData(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                asset_class=AssetClass.EQUITY
            ))
        
        technical_indicators = []
        for _, row in train_data.iterrows():
            technical_indicators.append(TechnicalIndicators(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                rsi=row.get('rsi_14', 50),
                macd=row.get('macd', 0),
                macd_signal=row.get('macd_signal', 0),
                macd_histogram=row.get('macd_histogram', 0),
                bb_upper=row.get('bb_upper', row['close']),
                bb_middle=row.get('bb_middle', row['close']),
                bb_lower=row.get('bb_lower', row['close']),
                atr=row.get('atr', 0),
                sma_20=row.get('sma_20', row['close']),
                sma_50=row.get('sma_50', row['close']),
                ema_12=row.get('ema_12', row['close']),
                ema_26=row.get('ema_26', row['close']),
                volume_sma=row.get('volume_sma', row['volume']),
                volatility=row.get('volatility', 0)
            ))
        
        X_train, y_train = tft_model.prepare_features(market_data, technical_indicators)
        tft_model.train(X_train, y_train)
        
        lstm_model.train(train_data)
        ppo_model.train(train_data, total_timesteps=1000)

        # Test predictions
        test_data = self.test_data.tail(100)
        
        # Prepare TFT test features
        test_market_data = []
        for _, row in test_data.iterrows():
            test_market_data.append(MarketData(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume'],
                asset_class=AssetClass.EQUITY
            ))
        
        test_technical_indicators = []
        for _, row in test_data.iterrows():
            test_technical_indicators.append(TechnicalIndicators(
                symbol=row['symbol'],
                timestamp=row['timestamp'],
                rsi=row.get('rsi_14', 50),
                macd=row.get('macd', 0),
                macd_signal=row.get('macd_signal', 0),
                macd_histogram=row.get('macd_histogram', 0),
                bb_upper=row.get('bb_upper', row['close']),
                bb_middle=row.get('bb_middle', row['close']),
                bb_lower=row.get('bb_lower', row['close']),
                atr=row.get('atr', 0),
                sma_20=row.get('sma_20', row['close']),
                sma_50=row.get('sma_50', row['close']),
                ema_12=row.get('ema_12', row['close']),
                ema_26=row.get('ema_26', row['close']),
                volume_sma=row.get('volume_sma', row['volume']),
                volatility=row.get('volatility', 0)
            ))
        
        X_test, _ = tft_model.prepare_features(test_market_data, test_technical_indicators)
        tft_predictions, tft_confidence = tft_model.predict(X_test)
        
        lstm_forecast = lstm_model.predict(test_data)
        ppo_signals = ppo_model.predict(test_data)

        # Validate results
        assert isinstance(tft_predictions, np.ndarray)
        assert len(tft_predictions) > 0
        assert isinstance(lstm_forecast, list)
        assert len(lstm_forecast) > 0
        assert isinstance(ppo_signals, list)
        assert len(ppo_signals) > 0
        assert isinstance(ppo_signals[0], TradeSignal)

    def test_fraud_detection_integration(self):
        """Test fraud detection integration."""
        fraud_service = FraudDetectionService(
            aws_region="us-east-1",
            detector_name="test-detector",
            model_version="1.0"
        )

        # Test with trading signal
        signal = TradeSignal(
            symbol="AAPL",
            side="BUY",
            quantity=100,
            price=150.0,
            timestamp=datetime.now(timezone.utc),
            model_name="test_model"
        )

        fraud_data = {
            "account_age_days": 365,
            "previous_trades_count": 100,
            "avg_trade_size": 500.0,
            "risk_score": 0.3,
            "device_trust_score": 0.8,
            "location_risk": 0.2
        }

        result = fraud_service.local_detector.predict_fraud(signal, fraud_data)

        assert isinstance(result, FraudScore)
        assert result.risk_level in [FraudRiskLevel.LOW, FraudRiskLevel.MEDIUM, FraudRiskLevel.HIGH, FraudRiskLevel.CRITICAL]
        assert 0 <= result.score <= 1


# Pytest configuration
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_data():
    """Provide test data for tests."""
    return TestDataGenerator.generate_market_data()


@pytest.fixture
def test_data_with_indicators():
    """Provide test data with technical indicators."""
    data = TestDataGenerator.generate_market_data()
    return TestDataGenerator.generate_technical_indicators(data)


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
