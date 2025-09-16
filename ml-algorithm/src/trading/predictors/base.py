"""Base predictor class for all ML models."""

import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone
import joblib
from pathlib import Path
from trading.config import settings, ModelType
from trading.schemas import Forecast, MarketData, TechnicalIndicators
from trading.logging_utils import TradingLogger, model_logger
from trading.model_registry import ModelMetadata


class BasePredictor(ABC):
    """Base class for all prediction models."""

    def __init__(self, model_name: str, symbol: str, config: Dict[str, Any]):
        self.model_name = model_name
        self.symbol = symbol
        self.config = config
        self.model = None
        self.is_trained = False
        self.feature_scaler = None
        self.target_scaler = None
        self.feature_columns = []
        self.training_history = {
            'train_loss': [],
            'val_loss': [],
            'metrics': []
        }

    @abstractmethod
    def prepare_features(
        self,
        market_data: List[MarketData],
        technical_indicators: List[TechnicalIndicators]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and targets for training/inference."""
        pass

    @abstractmethod
    def build_model(self) -> nn.Module:
        """Build the neural network model."""
        pass

    @abstractmethod
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray = None,
        y_val: np.ndarray = None
    ) -> Dict[str, float]:
        """Train the model."""
        pass

    @abstractmethod
    def predict(
        self,
        X: np.ndarray,
        return_confidence: bool = True
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Make predictions."""
        pass

    def save_model(self, path: str) -> None:
        """Save the trained model."""
        try:
            model_path = Path(path)
            model_path.mkdir(parents=True, exist_ok=True)

            # Save PyTorch model
            if self.model is not None:
                torch.save({
                    'model_state_dict': self.model.state_dict(),
                    'config': self.config,
                    'feature_columns': self.feature_columns,
                    'is_trained': self.is_trained,
                    'training_history': self.training_history
                }, model_path / 'model.pth')

            # Save scalers
            if self.feature_scaler is not None:
                joblib.dump(
                    self.feature_scaler,
                    model_path /
                    'feature_scaler.pkl')

            if self.target_scaler is not None:
                joblib.dump(
                    self.target_scaler,
                    model_path /
                    'target_scaler.pkl')

            model_logger.logger.info(
                "Model saved successfully",
                model_name=self.model_name,
                symbol=self.symbol,
                path=str(model_path)
            )

        except Exception as e:
            model_logger.log_error(
                "Model save error",
                f"Failed to save model: {str(e)}",
                symbol=self.symbol
            )
            raise

    def load_model(self, path: str) -> None:
        """Load a trained model."""
        try:
            model_path = Path(path)

            # Load PyTorch model
            checkpoint = torch.load(
                model_path / 'model.pth',
                map_location='cpu')
            self.config = checkpoint['config']
            self.feature_columns = checkpoint['feature_columns']
            self.is_trained = checkpoint['is_trained']
            self.training_history = checkpoint['training_history']

            # Rebuild model and load weights
            self.model = self.build_model()
            self.model.load_state_dict(checkpoint['model_state_dict'])

            # Load scalers
            if (model_path / 'feature_scaler.pkl').exists():
                self.feature_scaler = joblib.load(
                    model_path / 'feature_scaler.pkl')

            if (model_path / 'target_scaler.pkl').exists():
                self.target_scaler = joblib.load(
                    model_path / 'target_scaler.pkl')

            model_logger.logger.info(
                "Model loaded successfully",
                model_name=self.model_name,
                symbol=self.symbol,
                path=str(model_path)
            )

        except Exception as e:
            model_logger.log_error(
                "Model load error",
                f"Failed to load model: {str(e)}",
                symbol=self.symbol
            )
            raise

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        return {
            'model_name': self.model_name,
            'symbol': self.symbol,
            'config': self.config,
            'is_trained': self.is_trained,
            'feature_count': len(self.feature_columns),
            'training_history': self.training_history
        }

    def _create_sequences(
        self,
        data: np.ndarray,
        sequence_length: int,
        target_length: int = 1
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for time series prediction."""
        X, y = [], []

        for i in range(len(data) - sequence_length - target_length + 1):
            X.append(data[i:i + sequence_length])
            y.append(data[i + sequence_length:i +
                     sequence_length + target_length])

        return np.array(X), np.array(y)

    def _calculate_confidence_interval(
        self,
        predictions: np.ndarray,
        residuals: np.ndarray,
        confidence_level: float = 0.95
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Calculate confidence intervals for predictions."""
        alpha = 1 - confidence_level
        z_score = 1.96  # For 95% confidence

        # Use residual standard deviation
        residual_std = np.std(residuals)

        ci_low = predictions - z_score * residual_std
        ci_high = predictions + z_score * residual_std

        return ci_low, ci_high

    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Calculate evaluation metrics."""
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

    def _early_stopping(
        self,
        val_losses: List[float],
        patience: int,
        min_delta: float = 1e-4
    ) -> bool:
        """Check if early stopping criteria is met."""
        if len(val_losses) < patience:
            return False

        best_loss = min(val_losses[:-patience])
        current_loss = val_losses[-1]

        return current_loss - best_loss > min_delta

    def _log_training_progress(
        self,
        epoch: int,
        train_loss: float,
        val_loss: float = None,
        metrics: Dict[str, float] = None
    ) -> None:
        """Log training progress."""
        model_logger.log_training_metrics(
            model_name=self.model_name,
            epoch=epoch,
            train_loss=train_loss,
            val_loss=val_loss or 0.0,
            metrics=metrics or {}
        )

    def validate_data(self, data: np.ndarray) -> bool:
        """Validate input data."""
        if data is None or len(data) == 0:
            return False

        if np.any(np.isnan(data)) or np.any(np.isinf(data)):
            model_logger.log_error(
                "Data validation error",
                "Data contains NaN or infinite values",
                symbol=self.symbol
            )
            return False

        return True

    def preprocess_features(self, X: np.ndarray) -> np.ndarray:
        """Preprocess features (scaling, normalization, etc.)."""
        if self.feature_scaler is None:
            return X

        return self.feature_scaler.transform(X)

    def postprocess_predictions(self, y_pred: np.ndarray) -> np.ndarray:
        """Postprocess predictions (inverse scaling, etc.)."""
        if self.target_scaler is None:
            return y_pred

        return self.target_scaler.inverse_transform(
            y_pred.reshape(-1, 1)).flatten()

    def get_feature_importance(self) -> Optional[Dict[str, float]]:
        """Get feature importance scores."""
        # This is a placeholder - implement in subclasses if needed
        return None

    def explain_prediction(self, X: np.ndarray) -> Dict[str, Any]:
        """Explain a specific prediction."""
        # This is a placeholder - implement in subclasses if needed
        return {
            'prediction': None,
            'confidence': None,
            'feature_contributions': None,
            'explanation': "Feature explanation not implemented for this model"
        }
