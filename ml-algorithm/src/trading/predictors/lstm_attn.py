"""Production-ready LSTM with Attention implementation."""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional, Union
from datetime import datetime, timedelta
import pickle
import json
from pathlib import Path
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

from trading.config import settings
from trading.schemas import Forecast, MarketData, TechnicalIndicators
from trading.logging_utils import model_logger
from .base import BasePredictor


class AttentionLayer(nn.Module):
    """Multi-head attention layer for LSTM."""

    def __init__(
            self,
            hidden_size: int,
            num_heads: int = 8,
            dropout: float = 0.1):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_heads = num_heads
        self.head_dim = hidden_size // num_heads

        assert hidden_size % num_heads == 0, "Hidden size must be divisible by num_heads"

        self.query = nn.Linear(hidden_size, hidden_size)
        self.key = nn.Linear(hidden_size, hidden_size)
        self.value = nn.Linear(hidden_size, hidden_size)
        self.dropout = nn.Dropout(dropout)
        self.out_proj = nn.Linear(hidden_size, hidden_size)

    def forward(self, x: torch.Tensor,
                mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        batch_size, seq_len, hidden_size = x.shape

        # Linear projections
        Q = self.query(x).view(
            batch_size,
            seq_len,
            self.num_heads,
            self.head_dim).transpose(
            1,
            2)
        K = self.key(x).view(
            batch_size,
            seq_len,
            self.num_heads,
            self.head_dim).transpose(
            1,
            2)
        V = self.value(x).view(
            batch_size,
            seq_len,
            self.num_heads,
            self.head_dim).transpose(
            1,
            2)

        # Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / np.sqrt(self.head_dim)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)

        # Apply attention to values
        context = torch.matmul(attention_weights, V)
        context = context.transpose(
            1, 2).contiguous().view(
            batch_size, seq_len, hidden_size)

        # Output projection
        output = self.out_proj(context)
        return output


class LSTMAttentionModel(nn.Module):
    """LSTM with multi-head attention for time series forecasting."""

    def __init__(
        self,
        input_size: int,
        hidden_size: int,
        num_layers: int,
        output_size: int,
        num_heads: int = 8,
        dropout: float = 0.1,
        bidirectional: bool = True
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.bidirectional = bidirectional

        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional,
            batch_first=True
        )

        # Attention layer
        lstm_output_size = hidden_size * 2 if bidirectional else hidden_size
        self.attention = AttentionLayer(lstm_output_size, num_heads, dropout)

        # Output layers
        self.dropout = nn.Dropout(dropout)
        self.fc1 = nn.Linear(lstm_output_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, output_size)

    def forward(self, x: torch.Tensor,
                mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        # LSTM forward pass
        lstm_out, (hidden, cell) = self.lstm(x)

        # Apply attention
        attended_out = self.attention(lstm_out, mask)

        # Global average pooling
        pooled = torch.mean(attended_out, dim=1)

        # Output layers
        out = self.dropout(pooled)
        out = F.relu(self.fc1(out))
        out = self.dropout(out)
        out = self.fc2(out)

        return out


class ProductionLSTM(BasePredictor):
    """Production-ready LSTM with Attention implementation."""

    def __init__(
        self,
        model_name: str = "lstm_attention",
        symbol: str = "BTCUSD",
        config: Dict[str, Any] = None,
        input_size: int = 20,
        hidden_size: int = 128,
        num_layers: int = 3,
        output_size: int = 1,
        num_heads: int = 8,
        dropout: float = 0.1,
        sequence_length: int = 60,
        prediction_length: int = 1,
        learning_rate: float = 0.001,
        batch_size: int = 64,
        max_epochs: int = 100,
        device: str = "auto",
        scaler_type: str = "standard"
    ):
        if config is None:
            config = {}
        super().__init__(model_name, symbol, config)

        self.input_size = config.get('input_size', input_size)
        self.hidden_size = config.get('hidden_size', hidden_size)
        self.num_layers = config.get('num_layers', num_layers)
        self.output_size = config.get('output_size', output_size)
        self.num_heads = config.get('num_heads', num_heads)
        self.dropout = config.get('dropout', dropout)
        self.sequence_length = config.get('sequence_length', sequence_length)
        self.prediction_length = config.get('prediction_length', prediction_length)
        self.learning_rate = config.get('learning_rate', learning_rate)
        self.batch_size = config.get('batch_size', batch_size)
        self.max_epochs = config.get('max_epochs', max_epochs)
        self.scaler_type = scaler_type

        # Device configuration
        if device == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        # Model components
        self.model: Optional[LSTMAttentionModel] = None
        self.scaler: Optional[Union[StandardScaler, MinMaxScaler]] = None
        self.feature_columns: List[str] = []

        # Training state
        self.is_trained = False
        self.training_history = []
        self.best_model_path = None

        model_logger.logger.info(
            f"Initialized LSTM Attention model",
            extra={
                "model_name": model_name,
                "input_size": input_size,
                "hidden_size": hidden_size,
                "sequence_length": sequence_length,
                "device": self.device
            }
        )

    def _create_model(self) -> LSTMAttentionModel:
        """Create LSTM Attention model."""
        model = LSTMAttentionModel(
            input_size=self.input_size,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers,
            output_size=self.output_size,
            num_heads=self.num_heads,
            dropout=self.dropout
        )

        model_logger.logger.info(
            "Created LSTM Attention model", extra={
                "model_name": self.model_name, "total_parameters": sum(
                    p.numel() for p in model.parameters()), "trainable_parameters": sum(
                    p.numel() for p in model.parameters() if p.requires_grad)})

        return model

    def _prepare_data(
        self,
        data: pd.DataFrame,
        target_column: str = "close",
        feature_columns: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for LSTM training."""
        if feature_columns is None:
            # Default feature columns
            feature_columns = [
                "open",
                "high",
                "low",
                "close",
                "volume",
                "sma_20",
                "ema_12",
                "ema_26",
                "rsi_14",
                "macd",
                "macd_signal",
                "bb_upper",
                "bb_middle",
                "bb_lower",
                "atr_14",
                "stoch_k",
                "stoch_d",
                "williams_r",
                "cci_20",
                "roc_10",
                "momentum_10"]

        # Filter available columns
        available_features = [
            col for col in feature_columns if col in data.columns]
        if target_column not in data.columns:
            raise ValueError(
                f"Target column '{target_column}' not found in data")

        # Prepare feature matrix
        feature_data = data[available_features + [target_column]].copy()

        # Handle missing values
        feature_data = feature_data.fillna(
            method='ffill').fillna(
            method='bfill')

        # Scale features
        if self.scaler is None:
            if self.scaler_type == "standard":
                self.scaler = StandardScaler()
            else:
                self.scaler = MinMaxScaler()
            scaled_data = self.scaler.fit_transform(feature_data)
        else:
            scaled_data = self.scaler.transform(feature_data)

        # Create sequences
        X, y = [], []
        for i in range(
                self.sequence_length,
                len(scaled_data) -
                self.prediction_length +
                1):
            X.append(scaled_data[i - self.sequence_length:i, :-1])  # Features
            y.append(scaled_data[i:i + self.prediction_length, -1])  # Target

        X = np.array(X)
        y = np.array(y)

        # Update feature columns
        self.feature_columns = available_features

        model_logger.logger.info(
            "Prepared LSTM dataset",
            extra={
                "model_name": self.model_name,
                "samples": len(X),
                "features": len(self.feature_columns),
                "sequence_length": self.sequence_length
            }
        )

        return X, y

    def train(
        self,
        train_data: pd.DataFrame,
        validation_data: Optional[pd.DataFrame] = None,
        target_column: str = "close",
        feature_columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Train the LSTM Attention model."""
        try:
            model_logger.logger.info(
                "Starting LSTM Attention training",
                extra={
                    "model_name": self.model_name,
                    "train_samples": len(train_data)
                }
            )

            # Prepare training data
            X_train, y_train = self._prepare_data(
                train_data, target_column, feature_columns)

            # Prepare validation data
            X_val, y_val = None, None
            if validation_data is not None:
                X_val, y_val = self._prepare_data(
                    validation_data, target_column, feature_columns)

            # Create model
            self.model = self._create_model().to(self.device)

            # Setup training
            optimizer = torch.optim.Adam(
                self.model.parameters(), lr=self.learning_rate)
            criterion = nn.MSELoss()
            scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
                optimizer, mode='min', factor=0.5, patience=10
            )

            # Convert to tensors
            X_train_tensor = torch.FloatTensor(X_train).to(self.device)
            y_train_tensor = torch.FloatTensor(y_train).to(self.device)

            if X_val is not None:
                X_val_tensor = torch.FloatTensor(X_val).to(self.device)
                y_val_tensor = torch.FloatTensor(y_val).to(self.device)

            # Training loop
            best_val_loss = float('inf')
            patience_counter = 0
            training_history = []

            for epoch in range(self.max_epochs):
                # Training
                self.model.train()
                train_loss = 0.0

                # Mini-batch training
                for i in range(0, len(X_train_tensor), self.batch_size):
                    batch_X = X_train_tensor[i:i + self.batch_size]
                    batch_y = y_train_tensor[i:i + self.batch_size]

                    optimizer.zero_grad()
                    outputs = self.model(batch_X)
                    loss = criterion(outputs, batch_y)
                    loss.backward()
                    optimizer.step()

                    train_loss += loss.item()

                train_loss /= (len(X_train_tensor) // self.batch_size + 1)

                # Validation
                val_loss = 0.0
                if X_val is not None:
                    self.model.eval()
                    with torch.no_grad():
                        for i in range(0, len(X_val_tensor), self.batch_size):
                            batch_X = X_val_tensor[i:i + self.batch_size]
                            batch_y = y_val_tensor[i:i + self.batch_size]

                            outputs = self.model(batch_X)
                            loss = criterion(outputs, batch_y)
                            val_loss += loss.item()

                    val_loss /= (len(X_val_tensor) // self.batch_size + 1)
                    scheduler.step(val_loss)

                # Log progress
                epoch_info = {
                    "epoch": epoch + 1,
                    "train_loss": train_loss,
                    "val_loss": val_loss if X_val is not None else None,
                    "lr": optimizer.param_groups[0]['lr']
                }
                training_history.append(epoch_info)

                if epoch % 10 == 0:
                    model_logger.logger.info(
                        f"Epoch {epoch + 1}/{self.max_epochs}",
                        extra=epoch_info
                    )

                # Early stopping
                if X_val is not None:
                    if val_loss < best_val_loss:
                        best_val_loss = val_loss
                        patience_counter = 0
                        # Save best model
                        self.best_model_path = f"models/{
                            self.model_name}_best.pt"
                        torch.save(
                            self.model.state_dict(),
                            self.best_model_path)
                    else:
                        patience_counter += 1
                        if patience_counter >= 20:  # Early stopping patience
                            model_logger.logger.info(
                                f"Early stopping at epoch {epoch + 1}")
                            break

            # Load best model
            if self.best_model_path and Path(self.best_model_path).exists():
                self.model.load_state_dict(torch.load(self.best_model_path))

            self.is_trained = True
            self.training_history = training_history

            training_metrics = {
                "best_val_loss": best_val_loss,
                "total_epochs": len(training_history),
                "final_train_loss": training_history[-1]["train_loss"],
                "model_path": self.best_model_path
            }

            model_logger.logger.info(
                "LSTM Attention training completed",
                extra={
                    "model_name": self.model_name,
                    "best_val_loss": training_metrics["best_val_loss"],
                    "total_epochs": training_metrics["total_epochs"]
                }
            )

            return training_metrics

        except Exception as e:
            model_logger.logger.error(
                f"LSTM Attention training failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def predict(
        self,
        data: pd.DataFrame,
        target_column: str = "close",
        feature_columns: Optional[List[str]] = None,
        return_confidence: bool = True
    ) -> List[Forecast]:
        """Make predictions using the trained LSTM Attention model."""
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before making predictions")

        try:
            # Prepare prediction data
            X, _ = self._prepare_data(data, target_column, feature_columns)

            # Convert to tensor
            X_tensor = torch.FloatTensor(X).to(self.device)

            # Make predictions
            self.model.eval()
            with torch.no_grad():
                predictions = self.model(X_tensor)
                predictions = predictions.cpu().numpy()

            # Inverse transform predictions
            if self.scaler is not None:
                # Create dummy array for inverse transform
                dummy_array = np.zeros(
                    (predictions.shape[0], len(
                        self.feature_columns) + 1))
                dummy_array[:, -1] = predictions.flatten()
                predictions_scaled = self.scaler.inverse_transform(dummy_array)[
                    :, -1]
            else:
                predictions_scaled = predictions.flatten()

            # Create forecasts
            forecasts = []
            for i, pred in enumerate(predictions_scaled):
                if return_confidence:
                    # Simple confidence interval based on prediction variance
                    std_dev = np.std(predictions_scaled)
                    ci_low = pred - 1.96 * std_dev
                    ci_high = pred + 1.96 * std_dev
                    confidence = 0.95
                else:
                    ci_low = pred
                    ci_high = pred
                    confidence = 0.0

                forecast = Forecast(
                    symbol=data.iloc[i]["symbol"] if "symbol" in data.columns else "UNKNOWN",
                    timestamp=datetime.now(),
                    forecast=pred,
                    ci_low=ci_low,
                    ci_high=ci_high,
                    confidence=confidence,
                    model_name=self.model_name,
                    horizon=self.prediction_length,
                    metadata={
                        "sequence_length": self.sequence_length,
                        "prediction_length": self.prediction_length,
                        "features_used": self.feature_columns})
                forecasts.append(forecast)

            model_logger.logger.info(
                "LSTM Attention predictions completed",
                extra={
                    "model_name": self.model_name,
                    "num_predictions": len(forecasts)
                }
            )

            return forecasts

        except Exception as e:
            model_logger.logger.error(
                f"LSTM Attention prediction failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def evaluate(
        self,
        test_data: pd.DataFrame,
        target_column: str = "close",
        feature_columns: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """Evaluate the LSTM Attention model on test data."""
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before evaluation")

        try:
            # Prepare test data
            X_test, y_test = self._prepare_data(
                test_data, target_column, feature_columns)

            # Convert to tensors
            X_test_tensor = torch.FloatTensor(X_test).to(self.device)
            y_test_tensor = torch.FloatTensor(y_test).to(self.device)

            # Make predictions
            self.model.eval()
            with torch.no_grad():
                predictions = self.model(X_test_tensor)
                predictions = predictions.cpu().numpy()

            # Inverse transform
            if self.scaler is not None:
                dummy_array = np.zeros(
                    (predictions.shape[0], len(
                        self.feature_columns) + 1))
                dummy_array[:, -1] = predictions.flatten()
                predictions_scaled = self.scaler.inverse_transform(dummy_array)[
                    :, -1]

                dummy_array_y = np.zeros(
                    (y_test.shape[0], len(self.feature_columns) + 1))
                dummy_array_y[:, -1] = y_test.flatten()
                y_test_scaled = self.scaler.inverse_transform(dummy_array_y)[
                    :, -1]
            else:
                predictions_scaled = predictions.flatten()
                y_test_scaled = y_test.flatten()

            # Calculate metrics
            mae = mean_absolute_error(y_test_scaled, predictions_scaled)
            mse = mean_squared_error(y_test_scaled, predictions_scaled)
            rmse = np.sqrt(mse)
            mape = mean_absolute_percentage_error(
                y_test_scaled, predictions_scaled) * 100

            evaluation_metrics = {
                "mae": float(mae),
                "mse": float(mse),
                "rmse": float(rmse),
                "mape": float(mape)
            }

            model_logger.logger.info(
                "LSTM Attention evaluation completed",
                extra={
                    "model_name": self.model_name,
                    "mae": evaluation_metrics["mae"],
                    "rmse": evaluation_metrics["rmse"],
                    "mape": evaluation_metrics["mape"]
                }
            )

            return evaluation_metrics

        except Exception as e:
            model_logger.logger.error(
                f"LSTM Attention evaluation failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def save_model(self, path: str) -> None:
        """Save the trained LSTM Attention model."""
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before saving")

        try:
            model_path = Path(path)
            model_path.mkdir(parents=True, exist_ok=True)

            # Save model
            torch.save(self.model.state_dict(), model_path / "model.pt")

            # Save scaler
            if self.scaler is not None:
                with open(model_path / "scaler.pkl", "wb") as f:
                    pickle.dump(self.scaler, f)

            # Save configuration
            config = {
                "model_name": self.model_name,
                "input_size": self.input_size,
                "hidden_size": self.hidden_size,
                "num_layers": self.num_layers,
                "output_size": self.output_size,
                "num_heads": self.num_heads,
                "dropout": self.dropout,
                "sequence_length": self.sequence_length,
                "prediction_length": self.prediction_length,
                "learning_rate": self.learning_rate,
                "batch_size": self.batch_size,
                "max_epochs": self.max_epochs,
                "scaler_type": self.scaler_type,
                "feature_columns": self.feature_columns,
                "is_trained": self.is_trained,
                "best_model_path": self.best_model_path
            }

            with open(model_path / "config.json", "w") as f:
                json.dump(config, f, indent=2)

            model_logger.logger.info(
                "LSTM Attention model saved",
                extra={
                    "model_name": self.model_name,
                    "path": str(model_path)
                }
            )

        except Exception as e:
            model_logger.logger.error(
                f"LSTM Attention model save failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def load_model(self, path: str) -> None:
        """Load a trained LSTM Attention model."""
        try:
            model_path = Path(path)

            # Load configuration
            with open(model_path / "config.json", "r") as f:
                config = json.load(f)

            # Update model parameters
            for key, value in config.items():
                if hasattr(self, key):
                    setattr(self, key, value)

            # Load scaler
            scaler_path = model_path / "scaler.pkl"
            if scaler_path.exists():
                with open(scaler_path, "rb") as f:
                    self.scaler = pickle.load(f)

            # Create and load model
            self.model = self._create_model().to(self.device)
            self.model.load_state_dict(torch.load(model_path / "model.pt"))

            model_logger.logger.info(
                "LSTM Attention model loaded",
                extra={
                    "model_name": self.model_name,
                    "path": str(model_path),
                    "is_trained": self.is_trained
                }
            )

        except Exception as e:
            model_logger.logger.error(
                f"LSTM Attention model load failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def build_model(self) -> nn.Module:
        """Build the neural network model."""
        return self._create_model()

    def prepare_features(
        self,
        market_data: List[MarketData],
        technical_indicators: List[TechnicalIndicators]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and targets for training/inference."""
        # Convert market data to numpy arrays
        prices = np.array([data.close for data in market_data])
        volumes = np.array([data.volume for data in market_data])
        
        # Convert technical indicators to numpy arrays
        if technical_indicators:
            indicators = np.array([
                [ind.rsi, ind.macd, ind.bollinger_upper, ind.bollinger_lower]
                for ind in technical_indicators
            ])
        else:
            indicators = np.zeros((len(market_data), 4))
        
        # Combine features
        features = np.column_stack([prices, volumes, indicators])
        
        # Create targets (next price movement)
        targets = np.diff(prices)
        
        return features[:-1], targets

    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive model information."""
        info = {
            "model_name": self.model_name,
            "model_type": "LSTM_Attention",
            "is_trained": self.is_trained,
            "device": self.device,
            "parameters": {
                "input_size": self.input_size,
                "hidden_size": self.hidden_size,
                "num_layers": self.num_layers,
                "output_size": self.output_size,
                "num_heads": self.num_heads,
                "dropout": self.dropout,
                "sequence_length": self.sequence_length,
                "prediction_length": self.prediction_length,
                "learning_rate": self.learning_rate
            },
            "training_config": {
                "max_epochs": self.max_epochs,
                "batch_size": self.batch_size,
                "scaler_type": self.scaler_type
            },
            "feature_columns": self.feature_columns
        }

        if self.model is not None:
            info["model_stats"] = {
                "total_parameters": sum(
                    p.numel() for p in self.model.parameters()), "trainable_parameters": sum(
                    p.numel() for p in self.model.parameters() if p.requires_grad)}

        return info
