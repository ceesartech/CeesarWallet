"""Temporal Fusion Transformer implementation."""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from sklearn.preprocessing import StandardScaler
from trading.config import settings
from trading.schemas import Forecast, MarketData, TechnicalIndicators
from trading.logging_utils import model_logger
from .base import BasePredictor


class VariableSelectionNetwork(nn.Module):
    """Variable Selection Network for TFT."""

    def __init__(self, input_size: int, hidden_size: int, num_variables: int):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_variables = num_variables

        # Variable selection weights
        self.variable_selection = nn.Linear(input_size, num_variables)

        # Variable processing
        self.variable_processing = nn.ModuleList([
            nn.Linear(input_size, hidden_size) for _ in range(num_variables)
        ])

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, sequence_length, num_variables, input_size)
        batch_size, seq_len, num_vars, input_size = x.shape

        # Reshape for processing
        x_flat = x.view(batch_size * seq_len, num_vars, input_size)

        # Variable selection weights
        selection_weights = torch.softmax(
            self.variable_selection(
                x_flat.mean(
                    dim=1)), dim=-1)

        # Process each variable
        processed_vars = []
        for i in range(num_vars):
            var_data = x_flat[:, i, :]  # (batch_size * seq_len, input_size)
            processed = self.variable_processing[i](var_data)
            processed_vars.append(processed)

        # Apply selection weights
        # (batch_size * seq_len, num_vars, hidden_size)
        processed_vars = torch.stack(processed_vars, dim=1)
        # (batch_size * seq_len, num_vars, 1)
        selection_weights = selection_weights.unsqueeze(-1)

        selected_vars = processed_vars * selection_weights
        # (batch_size * seq_len, hidden_size)
        selected_vars = selected_vars.sum(dim=1)

        # Reshape back
        return selected_vars.view(batch_size, seq_len, self.hidden_size)


class GatedResidualNetwork(nn.Module):
    """Gated Residual Network for TFT."""

    def __init__(
            self,
            input_size: int,
            hidden_size: int,
            output_size: int,
            dropout: float = 0.1):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size

        self.input_projection = nn.Linear(input_size, hidden_size)
        self.hidden_projection = nn.Linear(hidden_size, hidden_size)
        self.output_projection = nn.Linear(hidden_size, output_size)

        self.dropout = nn.Dropout(dropout)
        self.layer_norm = nn.LayerNorm(output_size)

    def forward(
            self,
            x: torch.Tensor,
            context: torch.Tensor = None) -> torch.Tensor:
        # Input projection
        x_proj = self.input_projection(x)

        # Hidden processing
        hidden = F.elu(self.hidden_projection(x_proj))
        hidden = self.dropout(hidden)

        # Output projection
        output = self.output_projection(hidden)

        # Residual connection
        if self.input_size == self.output_size:
            output = output + x

        # Layer normalization
        output = self.layer_norm(output)

        return output


class TemporalFusionTransformer(BasePredictor):
    """Temporal Fusion Transformer for time series forecasting."""

    def __init__(self, model_name: str, symbol: str, config: Dict[str, Any]):
        super().__init__(model_name, symbol, config)

        # TFT specific parameters
        self.hidden_size = config.get('hidden_size', 128)
        self.num_heads = config.get('num_heads', 4)
        self.dropout = config.get('dropout', 0.1)
        self.quantiles = config.get('quantiles', [0.1, 0.5, 0.9])
        self.lookback_window = config.get('lookback_window', 256)
        self.prediction_horizon = config.get('prediction_horizon', 1)

        # Feature dimensions
        self.num_static_features = 0  # Will be set during training
        self.num_time_varying_features = 0  # Will be set during training
        self.num_known_features = 0  # Will be set during training

        # Build model
        self.model = self.build_model()

    def build_model(self) -> nn.Module:
        """Build the TFT model."""
        return TFTModel(
            hidden_size=self.hidden_size,
            num_heads=self.num_heads,
            dropout=self.dropout,
            quantiles=self.quantiles,
            lookback_window=self.lookback_window,
            prediction_horizon=self.prediction_horizon,
            num_static_features=self.num_static_features,
            num_time_varying_features=self.num_time_varying_features,
            num_known_features=self.num_known_features
        )

    def prepare_features(
        self,
        market_data: List[MarketData],
        technical_indicators: List[TechnicalIndicators]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features for TFT."""
        try:
            # Convert to DataFrames
            market_df = self._market_data_to_dataframe(market_data)
            indicators_df = self._indicators_to_dataframe(technical_indicators)

            # Merge data
            df = market_df.join(indicators_df, how='inner')

            if df.empty or len(df) < self.lookback_window + \
                    self.prediction_horizon:
                model_logger.log_error(
                    "Insufficient data",
                    f"Need at least {
                        self.lookback_window +
                        self.prediction_horizon} data points",
                    symbol=self.symbol)
                return np.array([]), np.array([])

            # Select features
            feature_columns = [
                'open', 'high', 'low', 'close', 'volume',
                'rsi', 'macd', 'macd_signal', 'macd_histogram',
                'bb_upper', 'bb_middle', 'bb_lower', 'atr',
                'sma_20', 'sma_50', 'ema_12', 'ema_26',
                'volume_sma', 'volatility'
            ]

            available_features = [
                col for col in feature_columns if col in df.columns]
            self.feature_columns = available_features

            # Prepare feature matrix
            features = df[available_features].values

            # Handle missing values
            features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)

            # Create sequences for TFT (predict only the last timestep)
            X, y = self._create_sequences(
                features, self.lookback_window, 1)

            if len(X) == 0:
                return np.array([]), np.array([])

            # Set feature dimensions
            self.num_time_varying_features = len(available_features)
            self.num_known_features = len(
                available_features)  # All features are known

            # Rebuild model with correct feature dimensions
            self.model = self.build_model()

            model_logger.logger.info(
                "Features prepared for TFT",
                symbol=self.symbol,
                sequence_count=len(X),
                feature_count=len(available_features)
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
        """Train the TFT model."""
        try:
            if not self.validate_data(
                    X_train) or not self.validate_data(y_train):
                raise ValueError("Invalid training data")

            # Initialize scalers
            self.feature_scaler = StandardScaler()
            self.target_scaler = StandardScaler()

            # Scale features
            X_train_scaled = self.feature_scaler.fit_transform(
                X_train.reshape(-1, X_train.shape[-1])
            ).reshape(X_train.shape)

            # Scale targets
            y_train_scaled = self.target_scaler.fit_transform(
                y_train.reshape(-1, 1)).reshape(y_train.shape)

            # Convert to tensors
            X_train_tensor = torch.FloatTensor(X_train_scaled)
            y_train_tensor = torch.FloatTensor(y_train_scaled)

            # Validation data
            X_val_tensor = None
            y_val_tensor = None
            if X_val is not None and y_val is not None:
                X_val_scaled = self.feature_scaler.transform(
                    X_val.reshape(-1, X_val.shape[-1])
                ).reshape(X_val.shape)
                y_val_scaled = self.target_scaler.transform(
                    y_val.reshape(-1, 1)).reshape(y_val.shape)

                X_val_tensor = torch.FloatTensor(X_val_scaled)
                y_val_tensor = torch.FloatTensor(y_val_scaled)

            # Training setup
            optimizer = torch.optim.AdamW(
                self.model.parameters(), lr=settings.learning_rate)
            scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
                optimizer, mode='min', factor=0.5, patience=5
            )

            best_val_loss = float('inf')
            patience_counter = 0

            # Training loop
            for epoch in range(settings.max_epochs):
                self.model.train()

                # Forward pass
                predictions = self.model(X_train_tensor)

                # Calculate quantile loss
                loss = self._quantile_loss(predictions, y_train_tensor)

                # Backward pass
                optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(), max_norm=1.0)
                optimizer.step()

                # Validation
                val_loss = None
                if X_val_tensor is not None and y_val_tensor is not None:
                    self.model.eval()
                    with torch.no_grad():
                        val_predictions = self.model(X_val_tensor)
                        val_loss = self._quantile_loss(
                            val_predictions, y_val_tensor).item()

                    scheduler.step(val_loss)

                    # Early stopping
                    if val_loss < best_val_loss:
                        best_val_loss = val_loss
                        patience_counter = 0
                    else:
                        patience_counter += 1

                    if patience_counter >= settings.early_stopping_patience:
                        model_logger.logger.info(
                            "Early stopping triggered",
                            epoch=epoch,
                            val_loss=val_loss
                        )
                        break

                # Log progress
                self.training_history['train_loss'].append(loss.item())
                if val_loss is not None:
                    self.training_history['val_loss'].append(val_loss)

                if epoch % 10 == 0:
                    self._log_training_progress(epoch, loss.item(), val_loss)

            self.is_trained = True

            # Calculate final metrics
            metrics = self._calculate_final_metrics(
                X_train_tensor, y_train_tensor, X_val_tensor, y_val_tensor)

            model_logger.logger.info(
                "TFT training completed",
                symbol=self.symbol,
                epochs=epoch + 1,
                final_loss=loss.item(),
                metrics=metrics
            )

            return metrics

        except Exception as e:
            model_logger.log_error(
                "TFT training error",
                f"Training failed: {str(e)}",
                symbol=self.symbol
            )
            raise

    def predict(
        self,
        X: np.ndarray,
        return_confidence: bool = True
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Make predictions with TFT."""
        try:
            if not self.is_trained:
                raise ValueError(
                    "Model must be trained before making predictions")

            if not self.validate_data(X):
                raise ValueError("Invalid input data")

            # Scale features
            X_scaled = self.feature_scaler.transform(
                X.reshape(-1, X.shape[-1])
            ).reshape(X.shape)

            # Convert to tensor
            X_tensor = torch.FloatTensor(X_scaled)

            # Make predictions
            self.model.eval()
            with torch.no_grad():
                predictions = self.model(X_tensor)

            # Extract quantile predictions
            quantile_predictions = predictions.cpu().numpy()

            # Get median prediction (0.5 quantile)
            median_idx = self.quantiles.index(0.5)
            y_pred = quantile_predictions[:, median_idx]

            # Inverse transform
            y_pred = self.target_scaler.inverse_transform(
                y_pred.reshape(-1, 1)).flatten()

            # Calculate confidence intervals
            confidence = None
            if return_confidence and len(self.quantiles) >= 3:
                low_idx = self.quantiles.index(0.1)
                high_idx = self.quantiles.index(0.9)

                ci_low = self.target_scaler.inverse_transform(
                    quantile_predictions[:, low_idx].reshape(-1, 1)
                ).flatten()
                ci_high = self.target_scaler.inverse_transform(
                    quantile_predictions[:, high_idx].reshape(-1, 1)
                ).flatten()

                confidence = np.column_stack([ci_low, ci_high])

            return y_pred, confidence

        except Exception as e:
            model_logger.log_error(
                "TFT prediction error",
                f"Prediction failed: {str(e)}",
                symbol=self.symbol
            )
            raise

    def load_model(self, path: str) -> None:
        """Load a trained TFT model."""
        try:
            model_path = Path(path)
            
            # Load checkpoint to get feature dimensions
            checkpoint = torch.load(
                model_path / 'model.pth',
                map_location='cpu')
            
            # Set feature dimensions before rebuilding model
            self.num_time_varying_features = checkpoint['config'].get('num_time_varying_features', 0)
            self.num_known_features = checkpoint['config'].get('num_known_features', 0)
            
            # Call parent load method
            super().load_model(path)
            
        except Exception as e:
            model_logger.log_error(
                "Model load error",
                f"Failed to load model: {str(e)}",
                symbol=self.symbol
            )
            raise

    def save_model(self, path: str) -> None:
        """Save the trained TFT model."""
        try:
            # Update config with feature dimensions
            self.config['num_time_varying_features'] = self.num_time_varying_features
            self.config['num_known_features'] = self.num_known_features
            
            # Call parent save method
            super().save_model(path)
            
        except Exception as e:
            model_logger.log_error(
                "Model save error",
                f"Failed to save model: {str(e)}",
                symbol=self.symbol
            )
            raise

    def _quantile_loss(self, predictions: torch.Tensor,
                       targets: torch.Tensor) -> torch.Tensor:
        """Calculate quantile loss."""
        losses = []
        for i, q in enumerate(self.quantiles):
            error = targets - predictions[:, i:i + 1]
            loss = torch.max(q * error, (q - 1) * error)
            losses.append(loss)

        return torch.mean(torch.stack(losses))

    def _market_data_to_dataframe(
            self, market_data: List[MarketData]) -> pd.DataFrame:
        """Convert market data to DataFrame."""
        import pandas as pd
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

    def _indicators_to_dataframe(
            self, indicators: List[TechnicalIndicators]) -> pd.DataFrame:
        """Convert technical indicators to DataFrame."""
        import pandas as pd
        data = []
        for item in indicators:
            data.append({
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
            })

        df = pd.DataFrame(data)
        df.set_index('timestamp', inplace=True)
        return df

    def _calculate_final_metrics(
        self,
        X_train: torch.Tensor,
        y_train: torch.Tensor,
        X_val: torch.Tensor = None,
        y_val: torch.Tensor = None
    ) -> Dict[str, float]:
        """Calculate final training metrics."""
        metrics = {}

        # Training metrics
        self.model.eval()
        with torch.no_grad():
            train_pred = self.model(X_train)
            train_loss = self._quantile_loss(train_pred, y_train).item()
            metrics['train_loss'] = train_loss

        # Validation metrics
        if X_val is not None and y_val is not None:
            with torch.no_grad():
                val_pred = self.model(X_val)
                val_loss = self._quantile_loss(val_pred, y_val).item()
                metrics['val_loss'] = val_loss

        return metrics


class TFTModel(nn.Module):
    """Temporal Fusion Transformer model."""

    def __init__(
        self,
        hidden_size: int,
        num_heads: int,
        dropout: float,
        quantiles: List[float],
        lookback_window: int,
        prediction_horizon: int,
        num_static_features: int,
        num_time_varying_features: int,
        num_known_features: int
    ):
        super().__init__()

        self.hidden_size = hidden_size
        self.num_heads = num_heads
        self.dropout = dropout
        self.quantiles = quantiles
        self.lookback_window = lookback_window
        self.prediction_horizon = prediction_horizon

        # Variable selection networks
        self.variable_selection = VariableSelectionNetwork(
            input_size=num_time_varying_features,
            hidden_size=hidden_size,
            num_variables=num_time_varying_features
        )

        # Gated residual networks
        self.grn_encoder = GatedResidualNetwork(
            hidden_size, hidden_size, hidden_size, dropout)
        self.grn_decoder = GatedResidualNetwork(
            hidden_size, hidden_size, hidden_size, dropout)

        # Multi-head attention
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True
        )

        # Position encoding
        self.position_encoding = nn.Parameter(
            torch.randn(lookback_window, hidden_size))

        # Output layers
        self.output_layer = nn.Linear(hidden_size, len(quantiles))

        # Dropout
        self.dropout_layer = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, sequence_length, num_features)
        batch_size, seq_len, num_features = x.shape

        # Reshape for variable selection
        x_reshaped = x.unsqueeze(2).expand(-1, -1, num_features, -1)

        # Variable selection
        selected_features = self.variable_selection(x_reshaped)

        # Add position encoding
        selected_features = selected_features + \
            self.position_encoding.unsqueeze(0)

        # Encoder GRN
        encoded = self.grn_encoder(selected_features)
        encoded = self.dropout_layer(encoded)

        # Self-attention
        attended, _ = self.attention(encoded, encoded, encoded)

        # Decoder GRN
        decoded = self.grn_decoder(attended)
        decoded = self.dropout_layer(decoded)

        # Output projection
        output = self.output_layer(decoded)

        # Return predictions for the last timestep
        return output[:, -1, :]  # (batch_size, num_quantiles)
