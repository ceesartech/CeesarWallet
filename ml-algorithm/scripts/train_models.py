#!/usr/bin/env python3
"""
Enhanced ML Model Training Script
Trains all ML models with comprehensive training data and improved reward functions.
"""

import asyncio
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from datetime import datetime, timezone
from pathlib import Path
import logging
import json
from typing import Dict, Any, List, Optional
import joblib
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split

# Add the src directory to the path
import sys
sys.path.append(str(Path(__file__).parent.parent / "src"))

from trading.predictors.tft import TemporalFusionTransformer
from trading.predictors.lstm_attn import ProductionLSTM
from trading.predictors.naive import NaivePredictor
from trading.policy.ppo import ProductionPPO
from trading.config import settings, ModelType
from trading.logging_utils import model_logger

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedModelTrainer:
    """Enhanced model trainer with comprehensive training pipeline."""
    
    def __init__(self, data_path: str, output_dir: str = "models"):
        self.data_path = data_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Model configurations
        self.model_configs = {
            ModelType.TFT: {
                "model_name": "tft_enhanced",
                "symbol": "AAPL",
                "config": {
                    "lookback_window": 60,
                    "prediction_horizon": 1,
                    "hidden_size": 128,
                    "num_layers": 3,
                    "dropout": 0.1,
                    "learning_rate": 0.001,
                    "batch_size": 64,
                    "max_epochs": 100
                }
            },
            ModelType.LSTM: {
                "model_name": "lstm_enhanced",
                "symbol": "AAPL",
                "config": {
                    "input_size": 50,
                    "hidden_size": 128,
                    "num_layers": 3,
                    "output_size": 1,
                    "num_heads": 8,
                    "dropout": 0.1,
                    "sequence_length": 60,
                    "prediction_length": 1,
                    "learning_rate": 0.001,
                    "batch_size": 64,
                    "max_epochs": 100
                }
            },
            ModelType.PPO: {
                "model_name": "ppo_enhanced",
                "symbol": "AAPL",
                "config": {
                    "total_timesteps": 200000,
                    "eval_freq": 10000,
                    "n_eval_episodes": 10,
                    "initial_balance": 100000.0,
                    "transaction_cost": 0.001,
                    "max_position_size": 0.1,
                    "learning_rate": 0.0003,
                    "n_steps": 2048,
                    "batch_size": 64,
                    "n_epochs": 10,
                    "gamma": 0.99,
                    "gae_lambda": 0.95,
                    "clip_range": 0.2,
                    "ent_coef": 0.01,
                    "vf_coef": 0.5
                }
            },
            ModelType.NAIVE: {
                "model_name": "naive_enhanced",
                "symbol": "AAPL",
                "config": {
                    "lookback_window": 20,
                    "prediction_horizon": 1
                }
            }
        }
        
        # Training data
        self.training_data = None
        self.validation_data = None
        
    def load_and_prepare_data(self) -> None:
        """Load and prepare training data."""
        
        logger.info(f"Loading training data from {self.data_path}")
        
        # Load data
        self.training_data = pd.read_csv(self.data_path)
        
        # Convert timestamp
        self.training_data['timestamp'] = pd.to_datetime(self.training_data['timestamp'])
        
        # Sort by timestamp
        self.training_data = self.training_data.sort_values('timestamp').reset_index(drop=True)
        
        # Handle missing values
        self.training_data = self.training_data.fillna(method='ffill').fillna(method='bfill')
        
        # Split into train/validation
        split_date = self.training_data['timestamp'].quantile(0.8)
        self.validation_data = self.training_data[
            self.training_data['timestamp'] >= split_date
        ].copy()
        self.training_data = self.training_data[
            self.training_data['timestamp'] < split_date
        ].copy()
        
        logger.info(f"Training data: {len(self.training_data)} samples")
        logger.info(f"Validation data: {len(self.validation_data)} samples")
        
        # Print data summary
        self._print_data_summary()
    
    def _print_data_summary(self) -> None:
        """Print data summary."""
        
        print("\n=== Training Data Summary ===")
        print(f"Total features: {len(self.training_data.columns)}")
        print(f"Date range: {self.training_data['timestamp'].min()} to {self.training_data['timestamp'].max()}")
        
        if 'symbol' in self.training_data.columns:
            print(f"Symbols: {self.training_data['symbol'].unique()}")
        
        # Feature categories
        feature_categories = {
            'Price Data': ['Open', 'High', 'Low', 'Close', 'Volume'],
            'Technical Indicators': [col for col in self.training_data.columns if any(indicator in col.lower() for indicator in ['sma', 'ema', 'rsi', 'macd', 'bb', 'atr', 'stoch', 'williams', 'cci'])],
            'Alternative Data': [col for col in self.training_data.columns if any(alt in col.lower() for alt in ['sentiment', 'vix', 'dxy', 'fear', 'greed'])],
            'Economic Data': [col for col in self.training_data.columns if any(econ in col.lower() for econ in ['interest', 'inflation', 'gdp', 'unemployment', 'confidence'])],
            'Regime Labels': [col for col in self.training_data.columns if 'regime' in col.lower()],
            'Cross-Asset': [col for col in self.training_data.columns if 'correlation' in col.lower()]
        }
        
        for category, features in feature_categories.items():
            if features:
                print(f"\n{category}: {len(features)} features")
                print(f"  {features[:5]}{'...' if len(features) > 5 else ''}")
    
    def train_tft_model(self) -> Dict[str, Any]:
        """Train Temporal Fusion Transformer model."""
        
        logger.info("Training TFT model...")
        
        config = self.model_configs[ModelType.TFT]
        model = TemporalFusionTransformer(
            model_name=config["model_name"],
            symbol=config["symbol"],
            config=config["config"]
        )
        
        # Prepare features
        X_train, y_train = self._prepare_tft_features(self.training_data)
        X_val, y_val = self._prepare_tft_features(self.validation_data)
        
        if len(X_train) == 0:
            logger.error("No training data available for TFT")
            return {"error": "No training data"}
        
        # Train model
        training_results = model.train(X_train, y_train, X_val, y_val)
        
        # Save model
        model_path = self.output_dir / f"{config['model_name']}.pkl"
        model.save_model(str(model_path))
        
        # Save training metadata
        metadata = {
            "model_type": "TFT",
            "training_samples": len(X_train),
            "validation_samples": len(X_val),
            "features": len(X_train[0]) if len(X_train) > 0 else 0,
            "training_results": training_results,
            "config": config["config"],
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
        
        metadata_path = self.output_dir / f"{config['model_name']}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"TFT model saved to {model_path}")
        return training_results
    
    def train_lstm_model(self) -> Dict[str, Any]:
        """Train LSTM Attention model."""
        
        logger.info("Training LSTM model...")
        
        config = self.model_configs[ModelType.LSTM]
        model = ProductionLSTM(
            model_name=config["model_name"],
            symbol=config["symbol"],
            config=config["config"]
        )
        
        # Train model
        training_results = model.train(
            self.training_data,
            self.validation_data,
            target_column="Close",
            feature_columns=self._get_feature_columns()
        )
        
        # Save model
        model_path = self.output_dir / f"{config['model_name']}.pkl"
        model.save_model(str(model_path))
        
        # Save training metadata
        metadata = {
            "model_type": "LSTM",
            "training_samples": len(self.training_data),
            "validation_samples": len(self.validation_data),
            "features": len(self._get_feature_columns()),
            "training_results": training_results,
            "config": config["config"],
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
        
        metadata_path = self.output_dir / f"{config['model_name']}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"LSTM model saved to {model_path}")
        return training_results
    
    def train_ppo_model(self) -> Dict[str, Any]:
        """Train PPO model with enhanced reward function."""
        
        logger.info("Training PPO model...")
        
        config = self.model_configs[ModelType.PPO]
        model = ProductionPPO(
            model_name=config["model_name"],
            symbol=config["symbol"],
            config=config["config"]
        )
        
        # Prepare training data for PPO
        ppo_data = self._prepare_ppo_data(self.training_data)
        ppo_val_data = self._prepare_ppo_data(self.validation_data)
        
        # Train model
        training_results = model.train(
            ppo_data,
            ppo_val_data,
            total_timesteps=config["config"]["total_timesteps"],
            eval_freq=config["config"]["eval_freq"],
            n_eval_episodes=config["config"]["n_eval_episodes"],
            initial_balance=config["config"]["initial_balance"],
            transaction_cost=config["config"]["transaction_cost"],
            max_position_size=config["config"]["max_position_size"],
            features=self._get_feature_columns()
        )
        
        # Save model
        model_path = self.output_dir / f"{config['model_name']}.pkl"
        model.save_model(str(model_path))
        
        # Save training metadata
        metadata = {
            "model_type": "PPO",
            "training_samples": len(ppo_data),
            "validation_samples": len(ppo_val_data),
            "features": len(self._get_feature_columns()),
            "training_results": training_results,
            "config": config["config"],
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
        
        metadata_path = self.output_dir / f"{config['model_name']}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"PPO model saved to {model_path}")
        return training_results
    
    def train_naive_model(self) -> Dict[str, Any]:
        """Train Naive model."""
        
        logger.info("Training Naive model...")
        
        config = self.model_configs[ModelType.NAIVE]
        model = NaivePredictor(
            model_name=config["model_name"],
            symbol=config["symbol"],
            config=config["config"]
        )
        
        # Prepare features
        X_train, y_train = self._prepare_naive_features(self.training_data)
        X_val, y_val = self._prepare_naive_features(self.validation_data)
        
        # Train model
        training_results = model.train(X_train, y_train, X_val, y_val)
        
        # Save model
        model_path = self.output_dir / f"{config['model_name']}.pkl"
        model.save_model(str(model_path))
        
        # Save training metadata
        metadata = {
            "model_type": "Naive",
            "training_samples": len(X_train),
            "validation_samples": len(X_val),
            "features": len(X_train[0]) if len(X_train) > 0 else 0,
            "training_results": training_results,
            "config": config["config"],
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
        
        metadata_path = self.output_dir / f"{config['model_name']}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Naive model saved to {model_path}")
        return training_results
    
    def _prepare_tft_features(self, data: pd.DataFrame) -> tuple:
        """Prepare features for TFT model."""
        
        # Select relevant features
        feature_columns = self._get_feature_columns()
        available_features = [col for col in feature_columns if col in data.columns]
        
        if not available_features:
            return np.array([]), np.array([])
        
        # Prepare feature matrix
        features = data[available_features].values
        
        # Handle missing values
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Create sequences
        lookback_window = 60
        X, y = [], []
        
        for i in range(lookback_window, len(features)):
            X.append(features[i-lookback_window:i])
            y.append(features[i, 0])  # Predict close price
        
        return np.array(X), np.array(y)
    
    def _prepare_ppo_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare data for PPO training."""
        
        # Select relevant features for PPO
        feature_columns = self._get_feature_columns()
        available_features = [col for col in feature_columns if col in data.columns]
        
        # Add required columns for PPO
        required_columns = ['Open', 'High', 'Low', 'Close', 'Volume'] + available_features
        
        ppo_data = data[required_columns].copy()
        
        # Ensure all required columns exist
        for col in required_columns:
            if col not in ppo_data.columns:
                ppo_data[col] = 0.0
        
        return ppo_data
    
    def _prepare_naive_features(self, data: pd.DataFrame) -> tuple:
        """Prepare features for Naive model."""
        
        # Simple moving average features
        feature_columns = ['Close', 'Volume']
        available_features = [col for col in feature_columns if col in data.columns]
        
        if not available_features:
            return np.array([]), np.array([])
        
        # Prepare feature matrix
        features = data[available_features].values
        
        # Handle missing values
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Create sequences
        lookback_window = 20
        X, y = [], []
        
        for i in range(lookback_window, len(features)):
            X.append(features[i-lookback_window:i])
            y.append(features[i, 0])  # Predict close price
        
        return np.array(X), np.array(y)
    
    def _get_feature_columns(self) -> List[str]:
        """Get list of feature columns."""
        
        if self.training_data is None:
            return []
        
        # Exclude non-feature columns
        exclude_columns = ['timestamp', 'symbol', 'Date', 'returns', 'log_returns']
        
        feature_columns = [
            col for col in self.training_data.columns 
            if col not in exclude_columns
        ]
        
        return feature_columns
    
    def train_all_models(self) -> Dict[str, Any]:
        """Train all models."""
        
        logger.info("Starting comprehensive model training...")
        
        results = {}
        
        try:
            # Train TFT model
            results['tft'] = self.train_tft_model()
        except Exception as e:
            logger.error(f"TFT training failed: {e}")
            results['tft'] = {"error": str(e)}
        
        try:
            # Train LSTM model
            results['lstm'] = self.train_lstm_model()
        except Exception as e:
            logger.error(f"LSTM training failed: {e}")
            results['lstm'] = {"error": str(e)}
        
        try:
            # Train PPO model
            results['ppo'] = self.train_ppo_model()
        except Exception as e:
            logger.error(f"PPO training failed: {e}")
            results['ppo'] = {"error": str(e)}
        
        try:
            # Train Naive model
            results['naive'] = self.train_naive_model()
        except Exception as e:
            logger.error(f"Naive training failed: {e}")
            results['naive'] = {"error": str(e)}
        
        # Save overall results
        results_path = self.output_dir / "training_results.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Training results saved to {results_path}")
        
        return results

def main():
    """Main training function."""
    
    # Check if training data exists
    data_path = "training_data_comprehensive.csv"
    if not Path(data_path).exists():
        logger.error(f"Training data not found at {data_path}")
        logger.info("Please run collect_training_data.py first")
        return
    
    # Initialize trainer
    trainer = EnhancedModelTrainer(data_path)
    
    # Load and prepare data
    trainer.load_and_prepare_data()
    
    # Train all models
    results = trainer.train_all_models()
    
    # Print results summary
    print("\n=== Training Results Summary ===")
    for model_name, result in results.items():
        if "error" in result:
            print(f"{model_name.upper()}: FAILED - {result['error']}")
        else:
            print(f"{model_name.upper()}: SUCCESS")
            if "final_loss" in result:
                print(f"  Final Loss: {result['final_loss']:.6f}")
            if "final_accuracy" in result:
                print(f"  Final Accuracy: {result['final_accuracy']:.4f}")
            if "sharpe_ratio" in result:
                print(f"  Sharpe Ratio: {result['sharpe_ratio']:.4f}")

if __name__ == "__main__":
    main()
