"""Production-ready Proximal Policy Optimization (PPO) implementation."""

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
from collections import deque
import gymnasium as gym
from gymnasium import spaces

from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv, SubprocVecEnv
from stable_baselines3.common.callbacks import EvalCallback, StopTrainingOnRewardThreshold
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.utils import set_random_seed

from trading.config import settings
from trading.schemas import TradeSignal, Forecast, MarketData, TechnicalIndicators
from trading.logging_utils import model_logger
from trading.predictors.base import BasePredictor


class TradingEnvironment(gym.Env):
    """Trading environment for PPO training."""

    def __init__(
        self,
        data: pd.DataFrame,
        initial_balance: float = 100000.0,
        transaction_cost: float = 0.001,
        max_position_size: float = 0.1,
        lookback_window: int = 60,
        features: List[str] = None
    ):
        super().__init__()

        self.data = data.reset_index(drop=True)
        self.initial_balance = initial_balance
        self.transaction_cost = transaction_cost
        self.max_position_size = max_position_size
        self.lookback_window = lookback_window

        if features is None:
            self.features = [
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
        else:
            self.features = features

        # Filter available features
        self.available_features = [
            f for f in self.features if f in self.data.columns]

        # Action space: [hold, buy, sell] with position sizing
        self.action_space = spaces.Box(
            low=np.array([-1.0, -1.0]),  # [action_type, position_size]
            high=np.array([1.0, 1.0]),
            dtype=np.float32
        )

        # Observation space: market features + portfolio state
        self.observation_space = spaces.Box(
            low=-np.inf,
            high=np.inf,
            # features + [balance, position, unrealized_pnl, realized_pnl]
            shape=(len(self.available_features) + 4,),
            dtype=np.float32
        )

        self.reset()

    def reset(self,
              seed: Optional[int] = None,
              options: Optional[Dict] = None) -> Tuple[np.ndarray,
                                                       Dict]:
        """Reset the environment."""
        super().reset(seed=seed)

        self.current_step = self.lookback_window
        self.balance = self.initial_balance
        self.position = 0.0
        self.position_value = 0.0
        self.unrealized_pnl = 0.0
        self.realized_pnl = 0.0
        self.total_trades = 0
        self.winning_trades = 0

        # Price history for lookback
        self.price_history = deque(maxlen=self.lookback_window)
        for i in range(self.lookback_window):
            self.price_history.append(self.data.iloc[i]["close"])

        observation = self._get_observation()
        info = self._get_info()

        return observation, info

    def step(self,
             action: np.ndarray) -> Tuple[np.ndarray,
                                          float,
                                          bool,
                                          bool,
                                          Dict]:
        """Execute one step in the environment."""
        # Parse action
        action_type = action[0]  # -1: sell, 0: hold, 1: buy
        position_size = action[1]  # -1 to 1, scaled to max_position_size

        # Get current price
        current_price = self.data.iloc[self.current_step]["close"]

        # Calculate position change
        if action_type > 0.1:  # Buy
            target_position = position_size * self.max_position_size
            position_change = target_position - self.position
        elif action_type < -0.1:  # Sell
            target_position = -position_size * self.max_position_size
            position_change = target_position - self.position
        else:  # Hold
            position_change = 0.0

        # Execute trade if position change is significant
        if abs(position_change) > 0.001:
            trade_value = abs(position_change) * self.balance
            transaction_cost = trade_value * self.transaction_cost

            # Update balance
            self.balance -= transaction_cost

            # Update position
            self.position += position_change

            # Update trade statistics
            self.total_trades += 1

        # Update position value and unrealized PnL
        self.position_value = self.position * self.balance
        self.unrealized_pnl = self.position * \
            (current_price - self.price_history[-1]) / self.price_history[-1] * self.balance

        # Calculate reward
        reward = self._calculate_reward(current_price)

        # Update price history
        self.price_history.append(current_price)

        # Move to next step
        self.current_step += 1

        # Check if episode is done
        done = self.current_step >= len(self.data) - 1

        # Get observation and info
        observation = self._get_observation()
        info = self._get_info()

        return observation, reward, done, False, info

    def _get_observation(self) -> np.ndarray:
        """Get current observation."""
        if self.current_step >= len(self.data):
            return np.zeros(self.observation_space.shape[0], dtype=np.float32)

        # Market features
        market_features = []
        for feature in self.available_features:
            value = self.data.iloc[self.current_step][feature]
            try:
                # Try to convert to float and check for NaN
                float_value = float(value)
                market_features.append(
                    float_value if not np.isnan(float_value) else 0.0)
            except (ValueError, TypeError):
                # If conversion fails, use 0.0
                market_features.append(0.0)

        # Portfolio state
        portfolio_state = [
            self.balance / self.initial_balance,  # Normalized balance
            self.position,  # Current position
            self.unrealized_pnl / self.initial_balance,  # Normalized unrealized PnL
            self.realized_pnl / self.initial_balance  # Normalized realized PnL
        ]

        observation = np.array(
            market_features +
            portfolio_state,
            dtype=np.float32)
        return observation

    def _get_info(self) -> Dict[str, Any]:
        """Get additional information."""
        return {
            "balance": self.balance,
            "position": self.position,
            "unrealized_pnl": self.unrealized_pnl,
            "realized_pnl": self.realized_pnl,
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "current_step": self.current_step
        }

    def _calculate_reward(self, current_price: float) -> float:
        """Calculate comprehensive reward for current state."""
        # Portfolio value
        portfolio_value = self.balance + self.position_value + self.unrealized_pnl
        
        # Calculate total return
        total_return = (portfolio_value - self.initial_balance) / self.initial_balance
        
        # Store returns for risk calculation
        if not hasattr(self, 'returns_history'):
            self.returns_history = []
        self.returns_history.append(total_return)
        
        # Keep only recent returns for calculation
        if len(self.returns_history) > 100:
            self.returns_history = self.returns_history[-100:]

        # 1. Return-based reward (40% weight)
        return_reward = self._calculate_return_reward(current_price, total_return)
        
        # 2. Risk-adjusted reward (25% weight)
        risk_reward = self._calculate_risk_reward()
        
        # 3. Drawdown penalty (20% weight)
        drawdown_penalty = self._calculate_drawdown_penalty(portfolio_value)
        
        # 4. Transaction efficiency (10% weight)
        transaction_reward = self._calculate_transaction_efficiency()
        
        # 5. Position sizing reward (5% weight)
        position_reward = self._calculate_position_reward()
        
        # Weighted combination
        total_reward = (
            0.4 * return_reward +
            0.25 * risk_reward +
            0.2 * drawdown_penalty +
            0.1 * transaction_reward +
            0.05 * position_reward
        )
        
        return total_reward
    
    def _calculate_return_reward(self, current_price: float, total_return: float) -> float:
        """Calculate return-based reward with volatility adjustment."""
        if self.current_step > self.lookback_window:
            previous_price = self.price_history[-2]
            price_return = (current_price - previous_price) / previous_price
            
            # Calculate market volatility
            if len(self.price_history) > 20:
                price_changes = np.diff(self.price_history[-20:])
                market_volatility = np.std(price_changes)
            else:
                market_volatility = 0.02  # Default volatility
            
            # Volatility-adjusted return
            if market_volatility > 0:
                vol_adjusted_return = price_return / market_volatility
            else:
                vol_adjusted_return = price_return
            
            # Reward for correct position direction with magnitude consideration
            if self.position > 0 and price_return > 0:
                # Non-linear reward for positive returns
                reward = np.tanh(vol_adjusted_return * abs(self.position) * 5)
            elif self.position < 0 and price_return < 0:
                reward = np.tanh(abs(vol_adjusted_return) * abs(self.position) * 5)
            elif self.position != 0:
                # Penalty for wrong direction
                reward = -abs(vol_adjusted_return) * abs(self.position) * 3
            else:
                reward = 0.0
        else:
            reward = 0.0
            
        return reward
    
    def _calculate_risk_reward(self) -> float:
        """Calculate risk-adjusted reward using Sharpe ratio."""
        if len(self.returns_history) < 10:
            return 0.0
            
        returns = np.array(self.returns_history)
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        risk_free_rate = 0.02 / 252  # Daily risk-free rate
        
        if std_return > 0:
            sharpe_ratio = (mean_return - risk_free_rate) / std_return
            # Reward for good Sharpe ratio
            if sharpe_ratio > 1.5:
                return 1.0
            elif sharpe_ratio > 0:
                return sharpe_ratio / 1.5
            else:
                return sharpe_ratio * 2  # Penalty for negative Sharpe
        else:
            return 0.0
    
    def _calculate_drawdown_penalty(self, portfolio_value: float) -> float:
        """Calculate drawdown penalty."""
        if not hasattr(self, 'peak_value'):
            self.peak_value = self.initial_balance
        
        # Update peak value
        if portfolio_value > self.peak_value:
            self.peak_value = portfolio_value
        
        # Calculate current drawdown
        current_drawdown = (self.peak_value - portfolio_value) / self.peak_value
        max_drawdown_threshold = 0.15
        
        if current_drawdown > max_drawdown_threshold:
            # Exponential penalty for large drawdowns
            penalty = -np.exp((current_drawdown - max_drawdown_threshold) * 10)
            return penalty
        else:
            # Small reward for controlled drawdowns
            return 0.1 * (1 - current_drawdown / max_drawdown_threshold)
    
    def _calculate_transaction_efficiency(self) -> float:
        """Calculate transaction efficiency reward."""
        if self.total_trades == 0:
            return 0.0
            
        # Calculate average trade profit
        if hasattr(self, 'trade_profits') and len(self.trade_profits) > 0:
            avg_trade_profit = np.mean(self.trade_profits)
        else:
            avg_trade_profit = 0.0
        
        # Calculate trade frequency (trades per step)
        trade_frequency = self.total_trades / max(self.current_step, 1)
        
        # Reward for profitable trades, penalize overtrading
        if avg_trade_profit > 0:
            efficiency_score = avg_trade_profit / (1 + trade_frequency * 10)
            return np.tanh(efficiency_score)
        else:
            return -trade_frequency * 0.1
    
    def _calculate_position_reward(self) -> float:
        """Calculate position sizing reward."""
        position_ratio = abs(self.position) / self.max_position_size
        
        # Reward for appropriate position sizing
        if position_ratio < 0.3:
            return 0.05  # Reward for conservative sizing
        elif position_ratio < 0.7:
            return 0.1   # Reward for moderate sizing
        elif position_ratio < 0.9:
            return 0.05  # Small reward for aggressive sizing
        else:
            return -0.1  # Penalty for excessive sizing


class ProductionPPO(BasePredictor):
    """Production-ready Proximal Policy Optimization implementation."""

    def __init__(
        self,
        model_name: str = "ppo",
        symbol: str = "BTCUSD",
        config: Dict[str, Any] = None,
        policy: str = "MlpPolicy",
        learning_rate: float = 3e-4,
        n_steps: int = 2048,
        batch_size: int = 64,
        n_epochs: int = 10,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_range: float = 0.2,
        ent_coef: float = 0.0,
        vf_coef: float = 0.5,
        max_grad_norm: float = 0.5,
        target_kl: Optional[float] = None,
        tensorboard_log: Optional[str] = None,
        device: str = "auto",
        seed: Optional[int] = None
    ):
        if config is None:
            config = {}
        super().__init__(model_name, symbol, config)

        self.policy = policy
        self.learning_rate = learning_rate
        self.n_steps = n_steps
        self.batch_size = batch_size
        self.n_epochs = n_epochs
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_range = clip_range
        self.ent_coef = ent_coef
        self.vf_coef = vf_coef
        self.max_grad_norm = max_grad_norm
        self.target_kl = target_kl
        self.tensorboard_log = tensorboard_log
        self.seed = seed

        # Device configuration
        if device == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        # Model components
        self.model: Optional[PPO] = None
        self.env: Optional[TradingEnvironment] = None
        self.eval_env: Optional[TradingEnvironment] = None

        # Training state
        self.is_trained = False
        self.training_history = []
        self.best_model_path = None

        # Set random seed
        if self.seed is not None:
            set_random_seed(self.seed)

        model_logger.logger.info(
            f"Initialized PPO model",
            extra={
                "model_name": model_name,
                "policy": policy,
                "learning_rate": learning_rate,
                "device": self.device
            }
        )

    def _create_model(self, env: TradingEnvironment) -> PPO:
        """Create PPO model."""
        model = PPO(
            policy=self.policy,
            env=env,
            learning_rate=self.learning_rate,
            n_steps=self.n_steps,
            batch_size=self.batch_size,
            n_epochs=self.n_epochs,
            gamma=self.gamma,
            gae_lambda=self.gae_lambda,
            clip_range=self.clip_range,
            ent_coef=self.ent_coef,
            vf_coef=self.vf_coef,
            max_grad_norm=self.max_grad_norm,
            target_kl=self.target_kl,
            tensorboard_log=self.tensorboard_log,
            device=self.device,
            verbose=1
        )

        model_logger.logger.info(
            "Created PPO model",
            extra={
                "model_name": self.model_name,
                "policy": self.policy,
                "total_parameters": sum(
                    p.numel() for p in model.policy.parameters())})

        return model

    def train(
        self,
        train_data: pd.DataFrame,
        validation_data: Optional[pd.DataFrame] = None,
        total_timesteps: int = 100000,
        eval_freq: int = 10000,
        n_eval_episodes: int = 5,
        initial_balance: float = 100000.0,
        transaction_cost: float = 0.001,
        max_position_size: float = 0.1,
        features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Train the PPO model."""
        try:
            # Store features for later use
            self.features = features
            
            model_logger.logger.info(
                "Starting PPO training",
                extra={
                    "model_name": self.model_name,
                    "total_timesteps": total_timesteps,
                    "train_samples": len(train_data)
                }
            )

            # Create training environment
            self.env = TradingEnvironment(
                data=train_data,
                initial_balance=initial_balance,
                transaction_cost=transaction_cost,
                max_position_size=max_position_size,
                features=features
            )

            # Create evaluation environment
            if validation_data is not None:
                self.eval_env = TradingEnvironment(
                    data=validation_data,
                    initial_balance=initial_balance,
                    transaction_cost=transaction_cost,
                    max_position_size=max_position_size,
                    features=features
                )

            # Create model
            self.model = self._create_model(self.env)

            # Setup callbacks
            callbacks = []
            if self.eval_env is not None:
                eval_callback = EvalCallback(
                    self.eval_env,
                    best_model_save_path=f"models/{self.model_name}",
                    log_path=f"logs/{self.model_name}",
                    eval_freq=eval_freq,
                    n_eval_episodes=n_eval_episodes,
                    deterministic=True,
                    render=False
                )
                callbacks.append(eval_callback)

            # Train model
            self.model.learn(
                total_timesteps=total_timesteps,
                callback=callbacks,
                progress_bar=True
            )

            self.is_trained = True
            self.best_model_path = f"models/{self.model_name}/best_model.zip"

            # Save model with training data sample
            self.save_model(f"models/{self.model_name}", train_data)

            training_metrics = {
                "total_timesteps": total_timesteps,
                "model_path": self.best_model_path,
                "final_reward": self._evaluate_model(n_episodes=10)
            }

            model_logger.logger.info(
                "PPO training completed",
                extra={
                    "model_name": self.model_name,
                    "total_timesteps": training_metrics["total_timesteps"],
                    "final_reward": training_metrics["final_reward"]
                }
            )

            return training_metrics

        except Exception as e:
            model_logger.logger.error(
                f"PPO training failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def predict(
        self,
        data: pd.DataFrame,
        features: Optional[List[str]] = None,
        deterministic: bool = True
    ) -> List[TradeSignal]:
        """Make trading predictions using the trained PPO model."""
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before making predictions")

        try:
            # Create prediction environment
            pred_env = TradingEnvironment(
                data=data,
                features=features
            )

            # Reset environment
            obs, _ = pred_env.reset()

            signals = []
            done = False

            while not done:
                # Get action from model
                action, _ = self.model.predict(
                    obs, deterministic=deterministic)

                # Execute action
                obs, reward, done, truncated, info = pred_env.step(action)

                # Create trade signal based on action
                action_type = action[0]
                position_size = action[1]

                if action_type > 0.05:  # Buy (lowered threshold)
                    side = "BUY"
                    quantity = abs(position_size) * pred_env.max_position_size
                elif action_type < -0.05:  # Sell (lowered threshold)
                    side = "SELL"
                    quantity = abs(position_size) * pred_env.max_position_size
                else:  # Hold
                    side = "HOLD"
                    quantity = 0.0

                # Create signal for all actions (including HOLD)
                signal = TradeSignal(
                    symbol=data.iloc[pred_env.current_step]["symbol"] if "symbol" in data.columns else "UNKNOWN",
                    side=side,
                    quantity=quantity,
                    order_type="MARKET",
                    timestamp=datetime.now(),
                    confidence=abs(action_type),
                    model_name=self.model_name,
                    metadata={
                        "action_type": action_type,
                        "position_size": position_size,
                        "reward": reward,
                        "step": pred_env.current_step
                    }
                )
                signals.append(signal)

            model_logger.logger.info(
                "PPO predictions completed",
                extra={
                    "model_name": self.model_name,
                    "num_signals": len(signals)
                }
            )

            return signals

        except Exception as e:
            model_logger.logger.error(
                f"PPO prediction failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def evaluate(
        self,
        test_data: pd.DataFrame,
        features: Optional[List[str]] = None,
        n_episodes: int = 10
    ) -> Dict[str, float]:
        """Evaluate the PPO model on test data."""
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before evaluation")

        try:
            # Create evaluation environment
            eval_env = TradingEnvironment(
                data=test_data,
                features=features
            )

            # Run evaluation episodes
            episode_rewards = []
            episode_returns = []
            episode_trades = []

            for episode in range(n_episodes):
                obs, _ = eval_env.reset()
                episode_reward = 0
                done = False

                while not done:
                    action, _ = self.model.predict(obs, deterministic=True)
                    obs, reward, done, truncated, info = eval_env.step(action)
                    episode_reward += reward

                # Calculate episode metrics
                final_balance = info["balance"]
                total_return = (
                    final_balance - eval_env.initial_balance) / eval_env.initial_balance

                episode_rewards.append(episode_reward)
                episode_returns.append(total_return)
                episode_trades.append(info["total_trades"])

            # Calculate evaluation metrics
            evaluation_metrics = {
                "mean_reward": float(np.mean(episode_rewards)),
                "std_reward": float(np.std(episode_rewards)),
                "mean_return": float(np.mean(episode_returns)),
                "std_return": float(np.std(episode_returns)),
                "mean_trades": float(np.mean(episode_trades)),
                "win_rate": float(np.mean([r > 0 for r in episode_returns])),
                "sharpe_ratio": float(np.mean(episode_returns) / np.std(episode_returns)) if np.std(episode_returns) > 0 else 0.0
            }

            model_logger.logger.info(
                "PPO evaluation completed",
                extra={
                    "model_name": self.model_name,
                    "mean_reward": evaluation_metrics["mean_reward"],
                    "mean_return": evaluation_metrics["mean_return"],
                    "win_rate": evaluation_metrics["win_rate"]
                }
            )

            return evaluation_metrics

        except Exception as e:
            model_logger.logger.error(
                f"PPO evaluation failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def _evaluate_model(self, n_episodes: int = 5) -> float:
        """Evaluate model performance."""
        if self.eval_env is None:
            return 0.0

        episode_rewards = []
        for _ in range(n_episodes):
            obs, _ = self.eval_env.reset()
            episode_reward = 0
            done = False

            while not done:
                action, _ = self.model.predict(obs, deterministic=True)
                obs, reward, done, truncated, info = self.eval_env.step(action)
                episode_reward += reward

            episode_rewards.append(episode_reward)

        return float(np.mean(episode_rewards))

    def save_model(self, path: str,
                   training_data_sample: Optional[pd.DataFrame] = None) -> None:
        """Save the trained PPO model with training metadata."""
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before saving")

        try:
            model_path = Path(path)
            model_path.mkdir(parents=True, exist_ok=True)

            # Save model
            self.model.save(model_path / "model")

            # Save configuration
            config = {
                "model_name": self.model_name,
                "policy": self.policy,
                "learning_rate": self.learning_rate,
                "n_steps": self.n_steps,
                "batch_size": self.batch_size,
                "n_epochs": self.n_epochs,
                "gamma": self.gamma,
                "gae_lambda": self.gae_lambda,
                "clip_range": self.clip_range,
                "ent_coef": self.ent_coef,
                "vf_coef": self.vf_coef,
                "max_grad_norm": self.max_grad_norm,
                "target_kl": self.target_kl,
                "tensorboard_log": self.tensorboard_log,
                "seed": self.seed,
                "is_trained": self.is_trained,
                "best_model_path": self.best_model_path
            }

            with open(model_path / "config.json", "w") as f:
                json.dump(config, f, indent=2)

            # Save training metadata for proper model loading
            if training_data_sample is not None:
                # Get the features that were actually used for training
                # Create a temporary environment to get the available features
                temp_env = TradingEnvironment(
                    data=training_data_sample.head(100),  # Use enough rows for lookback_window
                    features=self.features if hasattr(self, 'features') else None
                )
                used_features = temp_env.available_features
                
                training_metadata = {
                    "symbols": training_data_sample["symbol"].unique().tolist() if "symbol" in training_data_sample.columns else ["AAPL"],
                    "date_range": {
                        "start": training_data_sample["timestamp"].min().isoformat() if "timestamp" in training_data_sample.columns else "2023-01-01",
                        "end": training_data_sample["timestamp"].max().isoformat() if "timestamp" in training_data_sample.columns else "2023-12-31"},
                    "features": used_features,  # Only save features that were actually used
                    "data_shape": training_data_sample.shape,
                    "sample_size": len(training_data_sample)}

                with open(model_path / "training_metadata.json", "w") as f:
                    json.dump(training_metadata, f, indent=2)

                # Save a small sample of training data for environment
                # recreation
                sample_data = training_data_sample.head(
                    100)  # Save first 100 rows
                sample_data.to_csv(
                    model_path / "training_sample.csv", index=False)

            model_logger.logger.info(
                "PPO model saved",
                extra={
                    "model_name": self.model_name,
                    "path": str(model_path),
                    "training_data_shape": training_data_sample.shape if training_data_sample is not None else None
                }
            )

        except Exception as e:
            model_logger.logger.error(
                f"PPO model save failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def load_model(self, path: str,
                   training_data_sample: Optional[pd.DataFrame] = None) -> None:
        """Load a trained PPO model with proper environment setup."""
        try:
            model_path = Path(path)

            # Load configuration
            with open(model_path / "config.json", "r") as f:
                config = json.load(f)

            # Update model parameters
            for key, value in config.items():
                if hasattr(self, key):
                    setattr(self, key, value)

            # Create proper environment for model loading
            saved_features = None
            
            # Always try to load saved features from metadata
            metadata_path = model_path / "training_metadata.json"
            if metadata_path.exists():
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
                saved_features = metadata.get("features", None)
            
            if training_data_sample is not None:
                # Use provided training data sample
                env_data = training_data_sample
            else:
                if metadata_path.exists():
                    # Recreate training data sample from metadata
                    env_data = self._recreate_training_data_sample(metadata)
                else:
                    raise ValueError(
                        "No training data sample provided and no metadata found")

            # Create environment with proper data and features
            env = TradingEnvironment(
                data=env_data,
                initial_balance=100000.0,
                transaction_cost=0.001,
                max_position_size=0.1,
                features=saved_features if saved_features else None)

            # Load model with proper environment
            self.model = PPO.load(model_path / "model", env=env)

            model_logger.logger.info(
                "PPO model loaded",
                extra={
                    "model_name": self.model_name,
                    "path": str(model_path),
                    "is_trained": self.is_trained,
                    "training_data_shape": env_data.shape
                }
            )

        except Exception as e:
            model_logger.logger.error(
                f"PPO model load failed: {e}",
                extra={"model_name": self.model_name}
            )
            raise

    def _recreate_training_data_sample(
            self, metadata: Dict[str, Any]) -> pd.DataFrame:
        """Recreate training data sample from metadata."""
        try:
            # Extract data characteristics from metadata
            symbols = metadata.get("symbols", ["AAPL"])
            date_range = metadata.get(
                "date_range", {
                    "start": "2023-01-01", "end": "2023-12-31"})
            features = metadata.get(
                "features", [
                    "open", "high", "low", "close", "volume"])

            # Create realistic sample data based on metadata
            sample_data = []
            for symbol in symbols:
                # Generate realistic price data
                base_price = 100.0
                dates = pd.date_range(
                    start=date_range["start"],
                    end=date_range["end"],
                    freq="D")

                for date in dates:
                    # Simulate realistic price movement
                    price_change = np.random.normal(
                        0, 0.02)  # 2% daily volatility
                    base_price *= (1 + price_change)

                    # Generate OHLCV data
                    high = base_price * (1 + abs(np.random.normal(0, 0.01)))
                    low = base_price * (1 - abs(np.random.normal(0, 0.01)))
                    volume = np.random.randint(1000, 10000)

                    row = {
                        "symbol": symbol,
                        "timestamp": date,
                        "open": base_price * 0.99,
                        "high": high,
                        "low": low,
                        "close": base_price,
                        "volume": volume
                    }

                    # Add technical indicators if they were used in training
                    if "sma_20" in features:
                        row["sma_20"] = base_price * \
                            (1 + np.random.normal(0, 0.01))
                    if "rsi_14" in features:
                        row["rsi_14"] = np.random.uniform(20, 80)
                    if "macd" in features:
                        row["macd"] = np.random.normal(0, 0.1)

                    sample_data.append(row)

            return pd.DataFrame(sample_data)

        except Exception as e:
            model_logger.logger.error(
                f"Failed to recreate training data sample: {e}")
            # Fallback to minimal valid data
            return pd.DataFrame({
                "symbol": ["AAPL"] * 100,
                "timestamp": pd.date_range("2023-01-01", periods=100),
                "open": [100.0] * 100,
                "high": [101.0] * 100,
                "low": [99.0] * 100,
                "close": [100.0] * 100,
                "volume": [1000.0] * 100
            })

    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive model information."""
        info = {
            "model_name": self.model_name,
            "model_type": "PPO",
            "is_trained": self.is_trained,
            "device": self.device,
            "parameters": {
                "policy": self.policy,
                "learning_rate": self.learning_rate,
                "n_steps": self.n_steps,
                "batch_size": self.batch_size,
                "n_epochs": self.n_epochs,
                "gamma": self.gamma,
                "gae_lambda": self.gae_lambda,
                "clip_range": self.clip_range,
                "ent_coef": self.ent_coef,
                "vf_coef": self.vf_coef,
                "max_grad_norm": self.max_grad_norm,
                "target_kl": self.target_kl
            },
            "training_config": {
                "tensorboard_log": self.tensorboard_log,
                "seed": self.seed
            }
        }

        if self.model is not None:
            info["model_stats"] = {"total_parameters": sum(
                p.numel() for p in self.model.policy.parameters())}

        return info

    def build_model(self) -> nn.Module:
        """Build the neural network model."""
        # PPO uses stable-baselines3's built-in model architecture
        # This method is required by BasePredictor but not used in PPO
        return None

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
