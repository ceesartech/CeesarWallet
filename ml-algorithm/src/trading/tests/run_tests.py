"""Test runner for the complete trading system."""

from trading.logging_utils import TradingLogger
import asyncio
import sys
import os
import argparse
from pathlib import Path
from typing import List, Optional
import subprocess
import time

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent))


trade_logger = TradingLogger("trading.test_runner")


class TestRunner:
    """Test runner for the trading system."""

    def __init__(self):
        self.test_results = {}
        self.start_time = None
        self.end_time = None

    def run_unit_tests(self) -> bool:
        """Run unit tests."""
        trade_logger.logger.info("Running unit tests...")

        try:
            # Run pytest for unit tests
            result = subprocess.run([
                "python", "-m", "pytest",
                "tests/test_models.py",
                "-v", "--tb=short"
            ], capture_output=True, text=True)

            if result.returncode == 0:
                trade_logger.logger.info("Unit tests passed")
                self.test_results["unit_tests"] = True
                return True
            else:
                trade_logger.logger.error(
                    f"Unit tests failed: {result.stderr}")
                self.test_results["unit_tests"] = False
                return False

        except Exception as e:
            trade_logger.logger.error(f"Unit tests error: {e}")
            self.test_results["unit_tests"] = False
            return False

    def run_broker_tests(self) -> bool:
        """Run broker integration tests."""
        trade_logger.logger.info("Running broker integration tests...")

        try:
            # Run pytest for broker tests
            result = subprocess.run([
                "python", "-m", "pytest",
                "tests/test_brokers.py",
                "-v", "--tb=short"
            ], capture_output=True, text=True)

            if result.returncode == 0:
                trade_logger.logger.info("Broker tests passed")
                self.test_results["broker_tests"] = True
                return True
            else:
                trade_logger.logger.error(
                    f"Broker tests failed: {
                        result.stderr}")
                self.test_results["broker_tests"] = False
                return False

        except Exception as e:
            trade_logger.logger.error(f"Broker tests error: {e}")
            self.test_results["broker_tests"] = False
            return False

    def run_e2e_tests(self) -> bool:
        """Run end-to-end tests."""
        trade_logger.logger.info("Running end-to-end tests...")

        try:
            # Run pytest for e2e tests
            result = subprocess.run([
                "python", "-m", "pytest",
                "tests/test_e2e.py",
                "-v", "--tb=short"
            ], capture_output=True, text=True)

            if result.returncode == 0:
                trade_logger.logger.info("End-to-end tests passed")
                self.test_results["e2e_tests"] = True
                return True
            else:
                trade_logger.logger.error(
                    f"End-to-end tests failed: {result.stderr}")
                self.test_results["e2e_tests"] = False
                return False

        except Exception as e:
            trade_logger.logger.error(f"End-to-end tests error: {e}")
            self.test_results["e2e_tests"] = False
            return False

    def run_performance_tests(self) -> bool:
        """Run performance tests."""
        trade_logger.logger.info("Running performance tests...")

        try:
            # Run pytest for performance tests
            result = subprocess.run([
                "python", "-m", "pytest",
                "tests/test_models.py::TestIntegration::test_end_to_end_prediction",
                "tests/test_e2e.py::TestEndToEndSystem::test_performance_benchmarks",
                "-v", "--tb=short"
            ], capture_output=True, text=True)

            if result.returncode == 0:
                trade_logger.logger.info("Performance tests passed")
                self.test_results["performance_tests"] = True
                return True
            else:
                trade_logger.logger.error(
                    f"Performance tests failed: {
                        result.stderr}")
                self.test_results["performance_tests"] = False
                return False

        except Exception as e:
            trade_logger.logger.error(f"Performance tests error: {e}")
            self.test_results["performance_tests"] = False
            return False

    def run_all_tests(self) -> bool:
        """Run all tests."""
        trade_logger.logger.info("Starting comprehensive test suite...")
        self.start_time = time.time()

        all_passed = True

        # Run unit tests
        if not self.run_unit_tests():
            all_passed = False

        # Run broker tests
        if not self.run_broker_tests():
            all_passed = False

        # Run e2e tests
        if not self.run_e2e_tests():
            all_passed = False

        # Run performance tests
        if not self.run_performance_tests():
            all_passed = False

        self.end_time = time.time()

        # Print summary
        self.print_summary()

        return all_passed

    def print_summary(self):
        """Print test summary."""
        duration = self.end_time - self.start_time if self.start_time and self.end_time else 0

        trade_logger.logger.info("=" * 50)
        trade_logger.logger.info("TEST SUMMARY")
        trade_logger.logger.info("=" * 50)

        for test_name, result in self.test_results.items():
            status = "PASSED" if result else "FAILED"
            trade_logger.logger.info(f"{test_name}: {status}")

        trade_logger.logger.info(f"Total duration: {duration:.2f} seconds")

        overall_status = "PASSED" if all(
            self.test_results.values()) else "FAILED"
        trade_logger.logger.info(f"Overall status: {overall_status}")
        trade_logger.logger.info("=" * 50)

    def run_specific_test(self, test_name: str) -> bool:
        """Run specific test."""
        if test_name == "unit":
            return self.run_unit_tests()
        elif test_name == "broker":
            return self.run_broker_tests()
        elif test_name == "e2e":
            return self.run_e2e_tests()
        elif test_name == "performance":
            return self.run_performance_tests()
        else:
            trade_logger.logger.error(f"Unknown test: {test_name}")
            return False


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Run trading system tests")
    parser.add_argument(
        "--test",
        choices=["unit", "broker", "e2e", "performance", "all"],
        default="all",
        help="Test to run"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Verbose output"
    )

    args = parser.parse_args()

    runner = TestRunner()

    if args.test == "all":
        success = runner.run_all_tests()
    else:
        success = runner.run_specific_test(args.test)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
