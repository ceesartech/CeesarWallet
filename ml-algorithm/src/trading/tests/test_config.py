"""Test configuration and utilities."""

import os
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional
import json
import asyncio
from datetime import datetime, timezone

from trading.config import settings
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.test_config")


class TestConfig:
    """Test configuration."""

    # Test data configuration
    TEST_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "BTCUSDT", "EUR_USD"]
    TEST_DATA_DAYS = 1000
    TEST_TRAIN_SIZE = 200
    TEST_VALIDATION_SIZE = 100

    # Model configuration
    TEST_SEQUENCE_LENGTH = 60
    TEST_PREDICTION_LENGTH = 5
    TEST_HIDDEN_SIZE = 64
    TEST_NUM_LAYERS = 2
    TEST_DROPOUT = 0.1

    # Broker configuration
    TEST_BROKER_TIMEOUT = 30.0
    TEST_MAX_RETRIES = 3

    # Performance thresholds
    MAX_INFERENCE_TIME = 10.0  # seconds
    MAX_TRAINING_TIME = 300.0  # seconds
    MIN_ACCURACY_THRESHOLD = 0.6

    # Test environment
    TEST_ENVIRONMENT = "test"
    USE_SANDBOX = True

    @classmethod
    def get_test_environment_vars(cls) -> Dict[str, str]:
        """Get test environment variables."""
        return {
            "ALPACA_API_KEY": os.getenv("ALPACA_API_KEY", "test_key"),
            "ALPACA_SECRET_KEY": os.getenv("ALPACA_SECRET_KEY", "test_secret"),
            "ALPACA_SANDBOX": "true",
            "BINANCE_API_KEY": os.getenv("BINANCE_API_KEY", "test_key"),
            "BINANCE_SECRET_KEY": os.getenv("BINANCE_SECRET_KEY", "test_secret"),
            "BINANCE_SANDBOX": "true",
            "OANDA_API_KEY": os.getenv("OANDA_API_KEY", "test_key"),
            "OANDA_SECRET_KEY": os.getenv("OANDA_SECRET_KEY", "test_secret"),
            "OANDA_SANDBOX": "true",
            "REDIS_URL": "redis://localhost:6379",
            "POSTGRESQL_URL": "postgresql://test:test@localhost:5432/test_trading",
            "AWS_REGION": "us-east-1",
            "AWS_COGNITO_USER_POOL_ID": "us-east-1_test",
            "AWS_COGNITO_CLIENT_ID": "test_client_id",
            "AWS_COGNITO_CLIENT_SECRET": "test_client_secret",
            "JWT_SECRET_KEY": "test_jwt_secret_key",
            "ENCRYPTION_KEY": "test_encryption_key_32_bytes",
            "MONITORING_ENABLED": "true",
            "ALERT_ENABLED": "true",
            "PROMETHEUS_PORT": "8001"
        }

    @classmethod
    def setup_test_environment(cls):
        """Setup test environment."""
        # Set environment variables
        for key, value in cls.get_test_environment_vars().items():
            os.environ[key] = value

        trade_logger.logger.info("Test environment configured")

    @classmethod
    def cleanup_test_environment(cls):
        """Cleanup test environment."""
        # Remove test environment variables
        test_vars = cls.get_test_environment_vars()
        for key in test_vars.keys():
            if key in os.environ:
                del os.environ[key]

        trade_logger.logger.info("Test environment cleaned up")


class DataManager:
    """Test data manager."""

    def __init__(self):
        self.temp_dir = None
        self.test_data_cache = {}

    def setup(self):
        """Setup test data manager."""
        self.temp_dir = tempfile.mkdtemp()
        trade_logger.logger.info(f"Test data manager setup: {self.temp_dir}")

    def cleanup(self):
        """Cleanup test data manager."""
        if self.temp_dir and Path(self.temp_dir).exists():
            import shutil
            shutil.rmtree(self.temp_dir)
            trade_logger.logger.info("Test data manager cleaned up")

    def get_temp_path(self, filename: str) -> Path:
        """Get temporary file path."""
        if not self.temp_dir:
            self.setup()
        return Path(self.temp_dir) / filename

    def cache_test_data(self, key: str, data: Any):
        """Cache test data."""
        self.test_data_cache[key] = data

    def get_cached_test_data(self, key: str) -> Optional[Any]:
        """Get cached test data."""
        return self.test_data_cache.get(key)


class Metrics:
    """Test metrics collector."""

    def __init__(self):
        self.metrics = {}
        self.start_time = None
        self.end_time = None

    def start_test(self, test_name: str):
        """Start test timing."""
        self.start_time = datetime.now(timezone.utc)
        self.metrics[test_name] = {
            "start_time": self.start_time,
            "status": "running"
        }

    def end_test(self, test_name: str, status: str = "completed"):
        """End test timing."""
        self.end_time = datetime.now(timezone.utc)
        if test_name in self.metrics:
            self.metrics[test_name]["end_time"] = self.end_time
            self.metrics[test_name]["status"] = status
            self.metrics[test_name]["duration"] = (
                self.end_time - self.metrics[test_name]["start_time"]
            ).total_seconds()

    def add_metric(self, test_name: str, metric_name: str, value: Any):
        """Add metric to test."""
        if test_name not in self.metrics:
            self.metrics[test_name] = {}

        if "metrics" not in self.metrics[test_name]:
            self.metrics[test_name]["metrics"] = {}

        self.metrics[test_name]["metrics"][metric_name] = value

    def get_summary(self) -> Dict[str, Any]:
        """Get test summary."""
        summary = {
            "total_tests": len(self.metrics),
            "completed_tests": 0,
            "failed_tests": 0,
            "total_duration": 0,
            "test_details": self.metrics
        }

        for test_name, test_data in self.metrics.items():
            if test_data.get("status") == "completed":
                summary["completed_tests"] += 1
            elif test_data.get("status") == "failed":
                summary["failed_tests"] += 1

            if "duration" in test_data:
                summary["total_duration"] += test_data["duration"]

        return summary


class TestValidator:
    """Test result validator."""

    @staticmethod
    def validate_forecast(forecast) -> bool:
        """Validate forecast result."""
        if not forecast:
            return False

        # Check required fields
        required_fields = [
            "symbol",
            "timestamp",
            "horizon",
            "values",
            "confidence"]
        for field in required_fields:
            if not hasattr(forecast, field):
                return False

        # Check data types
        if not isinstance(forecast.values, list):
            return False

        if not isinstance(forecast.confidence, (int, float)):
            return False

        # Check value ranges
        if not (0 <= forecast.confidence <= 1):
            return False

        # Check values are positive
        for value in forecast.values:
            if not isinstance(value, (int, float)) or value <= 0:
                return False

        return True

    @staticmethod
    def validate_trade_signal(signal) -> bool:
        """Validate trade signal result."""
        if not signal:
            return False

        # Check required fields
        required_fields = [
            "symbol",
            "side",
            "quantity",
            "timestamp",
            "model_name"]
        for field in required_fields:
            if not hasattr(signal, field):
                return False

        # Check data types
        if not isinstance(signal.quantity, (int, float)):
            return False

        if signal.quantity <= 0:
            return False

        # Check side is valid
        valid_sides = ["BUY", "SELL", "HOLD"]
        if signal.side not in valid_sides:
            return False

        return True

    @staticmethod
    def validate_fraud_result(result: Dict[str, Any]) -> bool:
        """Validate fraud detection result."""
        if not result:
            return False

        # Check required fields
        required_fields = ["is_fraud", "fraud_score", "confidence"]
        for field in required_fields:
            if field not in result:
                return False

        # Check data types
        if not isinstance(result["is_fraud"], bool):
            return False

        if not isinstance(result["fraud_score"], (int, float)):
            return False

        if not isinstance(result["confidence"], (int, float)):
            return False

        # Check value ranges
        if not (0 <= result["fraud_score"] <= 1):
            return False

        if not (0 <= result["confidence"] <= 1):
            return False

        return True

    @staticmethod
    def validate_performance(metrics: Dict[str, Any]) -> bool:
        """Validate performance metrics."""
        if not metrics:
            return False

        # Check inference time
        if "inference_time" in metrics:
            if metrics["inference_time"] > TestConfig.MAX_INFERENCE_TIME:
                return False

        # Check training time
        if "training_time" in metrics:
            if metrics["training_time"] > TestConfig.MAX_TRAINING_TIME:
                return False

        # Check accuracy
        if "accuracy" in metrics:
            if metrics["accuracy"] < TestConfig.MIN_ACCURACY_THRESHOLD:
                return False

        return True


class Reporter:
    """Test reporter."""

    def __init__(self):
        self.reports = []

    def add_report(self, test_name: str, status: str, details: Dict[str, Any]):
        """Add test report."""
        report = {
            "test_name": test_name,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details
        }
        self.reports.append(report)

    def generate_summary_report(self) -> str:
        """Generate summary report."""
        total_tests = len(self.reports)
        passed_tests = sum(1 for r in self.reports if r["status"] == "passed")
        failed_tests = sum(1 for r in self.reports if r["status"] == "failed")

        report = f"""
TEST SUMMARY REPORT
==================
Total Tests: {total_tests}
Passed: {passed_tests}
Failed: {failed_tests}
Success Rate: {(passed_tests / total_tests * 100):.1f}%

DETAILED RESULTS
================
"""

        for report_item in self.reports:
            report += f"""
Test: {report_item['test_name']}
Status: {report_item['status']}
Timestamp: {report_item['timestamp']}
Details: {json.dumps(report_item['details'], indent=2)}
"""

        return report

    def save_report(self, filename: str):
        """Save report to file."""
        report = self.generate_summary_report()
        with open(filename, 'w') as f:
            f.write(report)

        trade_logger.logger.info(f"Test report saved to: {filename}")


# Global test instances
test_config = TestConfig()
test_data_manager = DataManager()
test_metrics = Metrics()
test_validator = TestValidator()
test_reporter = Reporter()


def setup_test_environment():
    """Setup test environment."""
    test_config.setup_test_environment()
    test_data_manager.setup()


def cleanup_test_environment():
    """Cleanup test environment."""
    test_config.cleanup_test_environment()
    test_data_manager.cleanup()


def get_test_config() -> TestConfig:
    """Get test configuration."""
    return test_config


def get_test_data_manager() -> DataManager:
    """Get test data manager."""
    return test_data_manager


def get_test_metrics() -> Metrics:
    """Get test metrics."""
    return test_metrics


def get_test_validator() -> TestValidator:
    """Get test validator."""
    return test_validator


def get_test_reporter() -> Reporter:
    """Get test reporter."""
    return test_reporter
