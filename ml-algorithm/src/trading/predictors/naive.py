"""Naive baseline predictor implementation."""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from sklearn.preprocessing import StandardScaler
from trading.config import settings
from trading.schemas import Forecast, MarketData, TechnicalIndicators
from trading.logging_utils import model_logger
from .base import BasePredictor


class NaivePredictor(BasePredictor):
    """Naive baseline predictor using simple statistical methods."""

    def __init__(self, model_name: str, symbol: str, config: Dict[str, Any]):
        super().__init__(model_name, symbol, config)

        # Naive specific parameters
        self.lookback_window = config.get('lookback_window', 20)
        self.prediction_horizon = config.get('prediction_horizon', 1)
        # last_value, mean, trend, seasonal
        self.method = config.get('method', 'last_value')

        # Model parameters
        self.last_values = []
        self.mean_value = 0.0
        self.trend_slope = 0.0
        self.seasonal_pattern = []

    def build_model(self) -> None:
        """Naive models don't need neural network architecture."""
        return None

    def prepare_features(
        self,
        market_data: List[MarketData],
        technical_indicators: List[TechnicalIndicators]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features for naive prediction."""
        try:
            # Convert to DataFrame
            market_df = self._market_data_to_dataframe(market_data)

            if market_df.empty or len(
                    market_df) < self.lookback_window + self.prediction_horizon:
                model_logger.log_error(
                    "Insufficient data",
                    f"Need at least {
                        self.lookback_window +
                        self.prediction_horizon} data points",
                    symbol=self.symbol)
                return np.array([]), np.array([])

            # Use close prices as the main feature
            prices = market_df['close'].values

            # Create sequences
            X, y = self._create_sequences(
                prices.reshape(-1, 1), self.lookback_window, self.prediction_horizon)

            if len(X) == 0:
                return np.array([]), np.array([])

            model_logger.logger.info(
                "Features prepared for naive predictor",
                symbol=self.symbol,
                sequence_count=len(X),
                method=self.method
            )

            return X, y

        except Exception as e:
            model_logger.log_error(
                "Feature preparation error",
                f"Failed to prepare features: {str(e)}",
                symbol=self.symbol
            )
            return np.array([]), np.array([])

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray = None,
        y_val: np.ndarray = None
    ) -> Dict[str, float]:
        """Train the naive model."""
        try:
            if not self.validate_data(
                    X_train) or not self.validate_data(y_train):
                raise ValueError("Invalid training data")

            # Extract price sequences
            # Assuming close price is first feature
            price_sequences = X_train[:, :, 0]

            if self.method == 'last_value':
                self._train_last_value(price_sequences, y_train)
            elif self.method == 'mean':
                self._train_mean(price_sequences, y_train)
            elif self.method == 'trend':
                self._train_trend(price_sequences, y_train)
            elif self.method == 'seasonal':
                self._train_seasonal(price_sequences, y_train)
            else:
                raise ValueError(f"Unknown naive method: {self.method}")

            self.is_trained = True

            # Calculate metrics
            metrics = self._calculate_metrics(X_train, y_train, X_val, y_val)

            model_logger.logger.info(
                "Naive model training completed",
                symbol=self.symbol,
                method=self.method,
                metrics=metrics
            )

            return metrics

        except Exception as e:
            model_logger.log_error(
                "Naive training error",
                f"Training failed: {str(e)}",
                symbol=self.symbol
            )
            raise

    def predict(
        self,
        X: np.ndarray,
        return_confidence: bool = True
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Make predictions with naive model."""
        try:
            if not self.is_trained:
                raise ValueError(
                    "Model must be trained before making predictions")

            if not self.validate_data(X):
                raise ValueError("Invalid input data")

            # Extract price sequences
            # Assuming close price is first feature
            price_sequences = X[:, :, 0]

            predictions = []
            confidence_intervals = []

            for sequence in price_sequences:
                if self.method == 'last_value':
                    pred = self._predict_last_value(sequence)
                elif self.method == 'mean':
                    pred = self._predict_mean(sequence)
                elif self.method == 'trend':
                    pred = self._predict_trend(sequence)
                elif self.method == 'seasonal':
                    pred = self._predict_seasonal(sequence)
                else:
                    pred = sequence[-1]  # Fallback to last value

                predictions.append(pred)

                # Calculate confidence interval
                if return_confidence:
                    ci_low, ci_high = self._calculate_confidence_interval(
                        sequence, pred)
                    confidence_intervals.append([ci_low, ci_high])

            predictions = np.array(predictions)
            confidence = np.array(
                confidence_intervals) if return_confidence else None

            return predictions, confidence

        except Exception as e:
            model_logger.log_error(
                "Naive prediction error",
                f"Prediction failed: {str(e)}",
                symbol=self.symbol
            )
            raise

    def _train_last_value(
            self,
            sequences: np.ndarray,
            targets: np.ndarray) -> None:
        """Train last value predictor."""
        # No training needed for last value method
        pass

    def _train_mean(self, sequences: np.ndarray, targets: np.ndarray) -> None:
        """Train mean predictor."""
        # Calculate mean of all training data
        all_prices = sequences.flatten()
        self.mean_value = np.mean(all_prices)

    def _train_trend(self, sequences: np.ndarray, targets: np.ndarray) -> None:
        """Train trend predictor."""
        # Calculate average trend slope
        slopes = []
        for sequence in sequences:
            if len(sequence) > 1:
                x = np.arange(len(sequence))
                slope, _ = np.polyfit(x, sequence, 1)
                slopes.append(slope)

        self.trend_slope = np.mean(slopes) if slopes else 0.0

    def _train_seasonal(
            self,
            sequences: np.ndarray,
            targets: np.ndarray) -> None:
        """Train seasonal predictor."""
        # Calculate seasonal pattern (assuming daily seasonality)
        if len(sequences) > 0:
            sequence_length = len(sequences[0])
            self.seasonal_pattern = np.zeros(sequence_length)

            for sequence in sequences:
                self.seasonal_pattern += sequence

            self.seasonal_pattern /= len(sequences)

    def _predict_last_value(self, sequence: np.ndarray) -> float:
        """Predict using last value."""
        return float(sequence[-1])

    def _predict_mean(self, sequence: np.ndarray) -> float:
        """Predict using mean value."""
        return float(self.mean_value)

    def _predict_trend(self, sequence: np.ndarray) -> float:
        """Predict using trend."""
        last_value = sequence[-1]
        return float(last_value + self.trend_slope)

    def _predict_seasonal(self, sequence: np.ndarray) -> float:
        """Predict using seasonal pattern."""
        if len(self.seasonal_pattern) > 0:
            # Use the seasonal pattern value at the current position
            pattern_idx = len(sequence) % len(self.seasonal_pattern)
            return float(self.seasonal_pattern[pattern_idx])
        else:
            return float(sequence[-1])

    def _calculate_confidence_interval(
        self,
        sequence: np.ndarray,
        prediction: float,
        confidence_level: float = 0.95
    ) -> Tuple[float, float]:
        """Calculate confidence interval for prediction."""
        # Use historical volatility
        returns = np.diff(sequence)
        volatility = np.std(returns) if len(returns) > 0 else 0.01

        # Calculate confidence interval
        z_score = 1.96  # For 95% confidence
        margin = z_score * volatility

        ci_low = prediction - margin
        ci_high = prediction + margin

        return ci_low, ci_high

    def _market_data_to_dataframe(
            self, market_data: List[MarketData]) -> pd.DataFrame:
        """Convert market data to DataFrame."""
        data = []
        for item in market_data:
            data.append({
                'timestamp': item.timestamp,
                'open': item.open,
                'high': item.high,
                'low': item.low,
                'close': item.close,
                'volume': item.volume
            })

        df = pd.DataFrame(data)
        df.set_index('timestamp', inplace=True)
        return df

    def _calculate_metrics(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray = None,
        y_val: np.ndarray = None
    ) -> Dict[str, float]:
        """Calculate evaluation metrics."""
        metrics = {}

        # Training metrics
        train_pred, _ = self.predict(X_train, return_confidence=False)
        # Flatten y_train to match predictions
        y_train_flat = y_train.flatten()
        train_metrics = self._calculate_metrics_single(
            y_train_flat, train_pred)
        metrics.update({f'train_{k}': v for k, v in train_metrics.items()})

        # Validation metrics
        if X_val is not None and y_val is not None:
            val_pred, _ = self.predict(X_val, return_confidence=False)
            # Flatten y_val to match predictions
            y_val_flat = y_val.flatten()
            val_metrics = self._calculate_metrics_single(
                y_val_flat, val_pred)
            metrics.update({f'val_{k}': v for k, v in val_metrics.items()})

        return metrics

    def _calculate_metrics_single(
            self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate metrics for single prediction set."""
        metrics = {}

        # Mean Absolute Error
        metrics['mae'] = np.mean(np.abs(y_true - y_pred))

        # Root Mean Square Error
        metrics['rmse'] = np.sqrt(np.mean((y_true - y_pred) ** 2))

        # Mean Absolute Percentage Error
        metrics['mape'] = np.mean(np.abs((y_true - y_pred) / y_true)) * 100

        # Directional Accuracy
        if len(y_true) > 1:
            true_direction = np.sign(np.diff(y_true))
            pred_direction = np.sign(np.diff(y_pred))
            metrics['directional_accuracy'] = np.mean(
                true_direction == pred_direction)

        # R-squared
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        metrics['r_squared'] = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

        return metrics

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        info = super().get_model_info()
        info.update({
            'method': self.method,
            'last_values_count': len(self.last_values),
            'mean_value': self.mean_value,
            'trend_slope': self.trend_slope,
            'seasonal_pattern_length': len(self.seasonal_pattern)
        })
        return info
