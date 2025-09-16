"""
Simplified Performance Tests for ML Algorithm Components

This module contains basic performance tests for ML components
to ensure they meet production performance requirements.
"""

import pytest
import time
import numpy as np
import pandas as pd
from typing import Dict, List, Any
import logging

from trading.predictors.tft import TemporalFusionTransformer as TFTModel
from trading.predictors.lstm_attn import ProductionLSTM
from trading.policy.ppo import ProductionPPO
from trading.fraud_detection import ProductionFraudDetectionService
from trading.data.market_data import MarketDataManager
from trading.tests.test_models import TestDataGenerator
from trading.schemas import MarketData, TechnicalIndicators, AssetClass
from trading.config import settings

logger = logging.getLogger(__name__)


class PerformanceTestSuite:
    """Basic performance test suite for ML components"""
    
    def __init__(self):
        self.data_generator = TestDataGenerator()
        self.results = {}
        
    def measure_execution_time(self, func, *args, **kwargs):
        """Measure execution time of a function"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        return result, execution_time


class TestBasicPerformance:
    """Basic performance tests for ML models"""
    
    def setup_method(self):
        self.test_suite = PerformanceTestSuite()
        
    def test_tft_initialization_performance(self):
        """Test TFT model initialization performance"""
        # Measure initialization time
        result, init_time = self.test_suite.measure_execution_time(
            lambda: TFTModel(
                model_name="tft_perf_test",
                symbol="AAPL",
                config={
                    "sequence_length": 60,
                    "prediction_horizon": 5,
                    "num_quantiles": 3,
                    "hidden_size": 64,
                    "num_attention_heads": 4,
                    "dropout": 0.1,
                    "learning_rate": 0.001,
                    "batch_size": 32,
                    "max_epochs": 10
                }
            )
        )
        
        # Performance assertions
        assert init_time < 5, f"TFT initialization took {init_time:.2f}s, expected < 5s"
        assert result is not None, "TFT initialization should return a result"
        
        logger.info(f"TFT Initialization Performance: {init_time:.2f}s")
        
    def test_lstm_initialization_performance(self):
        """Test LSTM model initialization performance"""
        # Measure initialization time
        result, init_time = self.test_suite.measure_execution_time(
            lambda: ProductionLSTM(
                model_name="lstm_perf_test",
                symbol="AAPL",
                config={
                    "sequence_length": 60,
                    "prediction_horizon": 5,
                    "hidden_size": 128,
                    "num_layers": 2,
                    "dropout": 0.2,
                    "learning_rate": 0.001,
                    "batch_size": 32,
                    "max_epochs": 10
                }
            )
        )
        
        # Performance assertions
        assert init_time < 5, f"LSTM initialization took {init_time:.2f}s, expected < 5s"
        assert result is not None, "LSTM initialization should return a result"
        
        logger.info(f"LSTM Initialization Performance: {init_time:.2f}s")
        
    def test_ppo_initialization_performance(self):
        """Test PPO model initialization performance"""
        # Measure initialization time
        result, init_time = self.test_suite.measure_execution_time(
            lambda: ProductionPPO(
                model_name="ppo_perf_test",
                symbol="AAPL",
                config={
                    "lookback_window": 60,
                    "learning_rate": 0.0003,
                    "batch_size": 64,
                    "n_epochs": 10,
                    "gamma": 0.99,
                    "gae_lambda": 0.95,
                    "clip_range": 0.2,
                    "ent_coef": 0.01,
                    "vf_coef": 0.5,
                    "max_grad_norm": 0.5,
                    "total_timesteps": 10000
                }
            )
        )
        
        # Performance assertions
        assert init_time < 10, f"PPO initialization took {init_time:.2f}s, expected < 10s"
        assert result is not None, "PPO initialization should return a result"
        
        logger.info(f"PPO Initialization Performance: {init_time:.2f}s")
        
    def test_fraud_detection_initialization_performance(self):
        """Test fraud detection service initialization performance"""
        # Measure initialization time
        result, init_time = self.test_suite.measure_execution_time(
            lambda: ProductionFraudDetectionService()
        )
        
        # Performance assertions
        assert init_time < 5, f"Fraud detection initialization took {init_time:.2f}s, expected < 5s"
        assert result is not None, "Fraud detection initialization should return a result"
        
        logger.info(f"Fraud Detection Initialization Performance: {init_time:.2f}s")
        
    def test_market_data_manager_initialization_performance(self):
        """Test market data manager initialization performance"""
        # Measure initialization time
        result, init_time = self.test_suite.measure_execution_time(
            lambda: MarketDataManager()
        )
        
        # Performance assertions
        assert init_time < 2, f"Market data manager initialization took {init_time:.2f}s, expected < 2s"
        assert result is not None, "Market data manager initialization should return a result"
        
        logger.info(f"Market Data Manager Initialization Performance: {init_time:.2f}s")
        
    def test_data_generation_performance(self):
        """Test data generation performance"""
        # Measure data generation time
        result, gen_time = self.test_suite.measure_execution_time(
            self.test_suite.data_generator.generate_market_data,
            symbol="AAPL",
            days=1000
        )
        
        # Performance assertions
        assert gen_time < 10, f"Data generation took {gen_time:.2f}s, expected < 10s"
        assert result is not None, "Data generation should return a result"
        assert len(result) > 0, "Generated data should not be empty"
        
        logger.info(f"Data Generation Performance: {gen_time:.2f}s for 1000 days")
        
    def test_technical_indicators_performance(self):
        """Test technical indicators generation performance"""
        # Generate base data first
        base_data = self.test_suite.data_generator.generate_market_data(
            symbol="AAPL",
            days=500
        )
        
        # Measure technical indicators generation time
        result, indicators_time = self.test_suite.measure_execution_time(
            self.test_suite.data_generator.generate_technical_indicators,
            base_data
        )
        
        # Performance assertions
        assert indicators_time < 5, f"Technical indicators generation took {indicators_time:.2f}s, expected < 5s"
        assert result is not None, "Technical indicators generation should return a result"
        assert len(result) > 0, "Generated indicators should not be empty"
        
        logger.info(f"Technical Indicators Performance: {indicators_time:.2f}s for 500 days")


# Performance test configuration
PERFORMANCE_THRESHOLDS = {
    "tft_initialization_time": 5,  # seconds
    "lstm_initialization_time": 5,  # seconds
    "ppo_initialization_time": 10,  # seconds
    "fraud_detection_initialization_time": 5,  # seconds
    "market_data_manager_initialization_time": 2,  # seconds
    "data_generation_time": 10,  # seconds
    "technical_indicators_time": 5,  # seconds
}


def run_performance_tests():
    """Run all performance tests and generate report"""
    logger.info("Starting performance test suite...")
    
    test_instance = TestBasicPerformance()
    test_instance.setup_method()
    
    results = {}
    
    # Run all test methods
    for method_name in dir(test_instance):
        if method_name.startswith('test_'):
            method = getattr(test_instance, method_name)
            try:
                method()
                results[method_name] = "PASSED"
            except Exception as e:
                results[method_name] = f"FAILED: {str(e)}"
                logger.error(f"Test {method_name} failed: {e}")
    
    # Generate report
    logger.info("Performance Test Results:")
    for test_name, result in results.items():
        logger.info(f"  {test_name}: {result}")
    
    return results


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run performance tests
    results = run_performance_tests()
    
    # Check if all tests passed
    failed_tests = [name for name, result in results.items() if result.startswith("FAILED")]
    
    if failed_tests:
        logger.error(f"Performance tests failed: {failed_tests}")
        exit(1)
    else:
        logger.info("All performance tests passed!")
        exit(0)
