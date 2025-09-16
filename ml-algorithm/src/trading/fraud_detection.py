"""Production-ready fraud detection service with AWS Fraud Detector integration."""

import asyncio
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import boto3
from botocore.exceptions import ClientError, BotoCoreError
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

from trading.config import settings
from trading.schemas import TradeSignal, TradeExecution
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.fraud_detection")


class FraudRiskLevel(Enum):
    """Fraud risk level enumeration."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FraudType(Enum):
    """Fraud type enumeration."""
    UNUSUAL_VOLUME = "UNUSUAL_VOLUME"
    PRICE_MANIPULATION = "PRICE_MANIPULATION"
    ACCOUNT_TAKEOVER = "ACCOUNT_TAKEOVER"
    MONEY_LAUNDERING = "MONEY_LAUNDERING"
    INSIDER_TRADING = "INSIDER_TRADING"
    PUMP_AND_DUMP = "PUMP_AND_DUMP"
    WASH_TRADING = "WASH_TRADING"
    SPOOFING = "SPOOFING"


@dataclass
class FraudScore:
    """Fraud score data class."""
    signal_id: str
    risk_level: FraudRiskLevel
    score: float
    fraud_type: Optional[FraudType] = None
    confidence: float = 0.0
    features: Dict[str, Any] = None
    metadata: Dict[str, Any] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = asdict(self)
        data['risk_level'] = self.risk_level.value
        data['fraud_type'] = self.fraud_type.value if self.fraud_type else None
        data['timestamp'] = self.timestamp.isoformat()
        return data


class AWSFraudDetectorClient:
    """Production-ready AWS Fraud Detector client."""

    def __init__(
        self,
        region_name: str = "us-east-1",
        detector_name: str = "pre-trade-detector",
        model_version: str = "1.0"
    ):
        self.region_name = region_name
        self.detector_name = detector_name
        self.model_version = model_version

        # Initialize AWS clients
        self.fraud_detector = boto3.client(
            'frauddetector',
            region_name=region_name
        )

        self.kinesis = boto3.client(
            'kinesis',
            region_name=region_name
        )

        # Configuration
        self.event_type = "pre-trade-event"
        self.entity_type = "customer"
        self.outcome_name = "fraud"

        trade_logger.logger.info(
            "Initialized AWS Fraud Detector client",
            extra={
                "region": region_name,
                "detector_name": detector_name,
                "model_version": model_version
            }
        )

    async def get_fraud_prediction(
        self,
        signal: TradeSignal,
        customer_id: str,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> FraudScore:
        """Get fraud prediction from AWS Fraud Detector."""
        try:
            # Prepare event data
            event_data = self._prepare_event_data(
                signal, customer_id, additional_data)

            # Call AWS Fraud Detector
            response = self.fraud_detector.get_event_prediction(
                detectorId=self.detector_name,
                detectorVersionId=self.model_version,
                eventId=f"event_{signal.timestamp.timestamp()}_{customer_id}",
                eventTypeName=self.event_type,
                eventTimestamp=signal.timestamp.isoformat(),
                entities=[
                    {
                        'entityType': self.entity_type,
                        'entityId': customer_id
                    }
                ],
                eventVariables=event_data
            )

            # Parse response
            fraud_score = self._parse_fraud_response(response, signal)

            # Send to Kinesis for real-time processing
            await self._send_to_kinesis(fraud_score)

            return fraud_score

        except ClientError as e:
            trade_logger.logger.error(
                f"AWS Fraud Detector error: {e}",
                extra={"error_code": e.response['Error']['Code']}
            )
            # Return default low-risk score on error
            return FraudScore(
                signal_id=str(signal.timestamp.timestamp()),
                risk_level=FraudRiskLevel.LOW,
                score=0.1,
                confidence=0.0,
                metadata={"error": str(e)}
            )
        except Exception as e:
            trade_logger.logger.error(f"Fraud prediction error: {e}")
            return FraudScore(
                signal_id=str(signal.timestamp.timestamp()),
                risk_level=FraudRiskLevel.LOW,
                score=0.1,
                confidence=0.0,
                metadata={"error": str(e)}
            )

    def _prepare_event_data(
        self,
        signal: TradeSignal,
        customer_id: str,
        additional_data: Optional[Dict[str, Any]]
    ) -> Dict[str, str]:
        """Prepare event data for AWS Fraud Detector."""
        event_data = {
            "symbol": signal.symbol,
            "side": signal.side.value,
            "quantity": str(
                signal.quantity),
            "price": str(
                signal.price) if signal.price else "0",
            "order_type": signal.order_type.value,
            "customer_id": customer_id,
            "timestamp": signal.timestamp.isoformat(),
            "confidence": str(
                signal.confidence) if signal.confidence else "0.5"}

        # Add additional data if provided
        if additional_data:
            for key, value in additional_data.items():
                event_data[key] = str(value)

        return event_data

    def _parse_fraud_response(
        self,
        response: Dict[str, Any],
        signal: TradeSignal
    ) -> FraudScore:
        """Parse AWS Fraud Detector response."""
        try:
            # Extract fraud score
            model_scores = response.get('modelScores', [])
            fraud_score_value = 0.0

            if model_scores:
                for model_score in model_scores:
                    if model_score.get('modelName') == 'fraud_model':
                        fraud_score_value = float(
                            model_score.get(
                                'scores', {}).get(
                                'fraud', 0.0))
                        break

            # Determine risk level
            if fraud_score_value >= 0.8:
                risk_level = FraudRiskLevel.CRITICAL
            elif fraud_score_value >= 0.6:
                risk_level = FraudRiskLevel.HIGH
            elif fraud_score_value >= 0.4:
                risk_level = FraudRiskLevel.MEDIUM
            else:
                risk_level = FraudRiskLevel.LOW

            # Extract fraud type if available
            fraud_type = None
            if fraud_score_value > 0.5:
                # Determine fraud type based on signal characteristics
                fraud_type = self._determine_fraud_type(
                    signal, fraud_score_value)

            return FraudScore(
                signal_id=str(signal.timestamp.timestamp()),
                risk_level=risk_level,
                score=fraud_score_value,
                fraud_type=fraud_type,
                confidence=float(response.get('confidence', 0.0)),
                features=response.get('modelScores', []),
                metadata={
                    "detector_id": response.get('detectorId'),
                    "detector_version": response.get('detectorVersionId'),
                    "event_id": response.get('eventId'),
                    "rule_results": response.get('ruleResults', [])
                }
            )

        except Exception as e:
            trade_logger.logger.error(f"Response parsing error: {e}")
            return FraudScore(
                signal_id=str(signal.timestamp.timestamp()),
                risk_level=FraudRiskLevel.LOW,
                score=0.1,
                confidence=0.0,
                metadata={"parsing_error": str(e)}
            )

    def _determine_fraud_type(
            self,
            signal: TradeSignal,
            score: float) -> FraudType:
        """Determine fraud type based on signal characteristics."""
        # Simple heuristic-based fraud type detection
        if signal.quantity > 10000:  # Large volume
            return FraudType.UNUSUAL_VOLUME
        elif signal.confidence and signal.confidence > 0.9:  # High confidence
            return FraudType.INSIDER_TRADING
        elif signal.order_type.value == "MARKET" and signal.quantity > 5000:
            return FraudType.PUMP_AND_DUMP
        else:
            return FraudType.ACCOUNT_TAKEOVER

    async def _send_to_kinesis(self, fraud_score: FraudScore) -> None:
        """Send fraud score to Kinesis for real-time processing."""
        try:
            stream_name = "fraud-scores-stream"

            # Prepare record
            record_data = {
                "fraud_score": fraud_score.to_dict(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

            # Send to Kinesis
            self.kinesis.put_record(
                StreamName=stream_name,
                Data=json.dumps(record_data),
                PartitionKey=fraud_score.signal_id
            )

            trade_logger.logger.debug(
                "Sent fraud score to Kinesis",
                extra={
                    "signal_id": fraud_score.signal_id,
                    "score": fraud_score.score})

        except Exception as e:
            trade_logger.logger.error(f"Kinesis send error: {e}")


class LocalFraudDetector:
    """Local fraud detection using machine learning models."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.isolation_forest = None
        self.scaler = StandardScaler()
        self.is_trained = False

        # Load model if path provided
        if model_path and Path(model_path).exists():
            self.load_model(model_path)

        trade_logger.logger.info("Initialized local fraud detector")

    def train_model(self, training_data: List[Dict[str, Any]]) -> None:
        """Train the local fraud detection model."""
        try:
            # Extract features
            features = []
            for data_point in training_data:
                feature_vector = self._extract_features(data_point)
                features.append(feature_vector)

            # Convert to numpy array
            X = np.array(features)

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Train Isolation Forest
            self.isolation_forest = IsolationForest(
                contamination=0.1,  # Expect 10% fraud
                random_state=42,
                n_estimators=100
            )
            self.isolation_forest.fit(X_scaled)

            self.is_trained = True

            trade_logger.logger.info(
                "Local fraud detector trained",
                extra={"training_samples": len(training_data)}
            )

        except Exception as e:
            trade_logger.logger.error(
                f"Local fraud detector training failed: {e}")
            raise

    def predict_fraud(self,
                      signal: TradeSignal,
                      additional_data: Optional[Dict[str,
                                                     Any]] = None) -> FraudScore:
        """Predict fraud using local model."""
        try:
            if not self.is_trained:
                return FraudScore(
                    signal_id=str(signal.timestamp.timestamp()),
                    risk_level=FraudRiskLevel.LOW,
                    score=0.1,
                    confidence=0.0,
                    metadata={"error": "Model not trained"}
                )

            # Prepare data point
            data_point = {
                "signal": signal,
                "additional_data": additional_data or {}
            }

            # Extract features
            feature_vector = self._extract_features(data_point)
            X = np.array([feature_vector])

            # Scale features
            X_scaled = self.scaler.transform(X)

            # Predict
            anomaly_score = self.isolation_forest.decision_function(X_scaled)[
                0]
            is_anomaly = self.isolation_forest.predict(X_scaled)[0]

            # Convert to fraud score (0-1 scale)
            fraud_score_value = max(0, min(1, (1 - anomaly_score) / 2))

            # Determine risk level
            if fraud_score_value >= 0.8:
                risk_level = FraudRiskLevel.CRITICAL
            elif fraud_score_value >= 0.6:
                risk_level = FraudRiskLevel.HIGH
            elif fraud_score_value >= 0.4:
                risk_level = FraudRiskLevel.MEDIUM
            else:
                risk_level = FraudRiskLevel.LOW

            return FraudScore(
                signal_id=str(
                    signal.timestamp.timestamp()),
                risk_level=risk_level,
                score=fraud_score_value,
                fraud_type=self._determine_fraud_type(signal),
                confidence=abs(anomaly_score),
                features={
                    "anomaly_score": anomaly_score,
                    "is_anomaly": bool(is_anomaly)},
                metadata={
                    "model_type": "isolation_forest"})

        except Exception as e:
            trade_logger.logger.error(f"Local fraud prediction error: {e}")
            return FraudScore(
                signal_id=str(signal.timestamp.timestamp()),
                risk_level=FraudRiskLevel.LOW,
                score=0.1,
                confidence=0.0,
                metadata={"error": str(e)}
            )

    def _extract_features(self, data_point: Dict[str, Any]) -> List[float]:
        """Extract features for fraud detection."""
        signal = data_point["signal"]
        additional_data = data_point.get("additional_data", {})

        features = [
            signal.quantity,
            signal.price or 0.0,
            signal.confidence or 0.5,
            len(signal.symbol),
            additional_data.get("account_age_days", 0),
            additional_data.get("previous_trades_count", 0),
            additional_data.get("avg_trade_size", 0),
            additional_data.get("risk_score", 0.5),
            additional_data.get("device_trust_score", 0.5),
            additional_data.get("location_risk", 0.5)
        ]

        return features

    def _determine_fraud_type(self, signal: TradeSignal) -> FraudType:
        """Determine fraud type based on signal characteristics."""
        if signal.quantity > 10000:
            return FraudType.UNUSUAL_VOLUME
        elif signal.confidence and signal.confidence > 0.9:
            return FraudType.INSIDER_TRADING
        elif signal.order_type.value == "MARKET":
            return FraudType.PUMP_AND_DUMP
        else:
            return FraudType.ACCOUNT_TAKEOVER

    def save_model(self, path: str) -> None:
        """Save the trained model."""
        try:
            model_path = Path(path)
            model_path.mkdir(parents=True, exist_ok=True)

            if self.isolation_forest is not None:
                joblib.dump(
                    self.isolation_forest,
                    model_path /
                    "isolation_forest.pkl")
                joblib.dump(self.scaler, model_path / "scaler.pkl")

                trade_logger.logger.info(
                    f"Local fraud detector model saved: {path}")

        except Exception as e:
            trade_logger.logger.error(f"Model save error: {e}")
            raise

    def load_model(self, path: str) -> None:
        """Load a trained model."""
        try:
            model_path = Path(path)

            if (model_path / "isolation_forest.pkl").exists():
                self.isolation_forest = joblib.load(
                    model_path / "isolation_forest.pkl")
                self.scaler = joblib.load(model_path / "scaler.pkl")
                self.is_trained = True

                trade_logger.logger.info(
                    f"Local fraud detector model loaded: {path}")

        except Exception as e:
            trade_logger.logger.error(f"Model load error: {e}")
            raise


class ProductionFraudDetectionService:
    """Production-ready fraud detection service."""

    def __init__(
        self,
        aws_region: str = "us-east-1",
        detector_name: str = "pre-trade-detector",
        model_version: str = "1.0",
        local_model_path: Optional[str] = None,
        fallback_to_local: bool = True
    ):
        self.aws_region = aws_region
        self.detector_name = detector_name
        self.model_version = model_version
        self.fallback_to_local = fallback_to_local

        # Initialize AWS client
        self.aws_client = AWSFraudDetectorClient(
            region_name=aws_region,
            detector_name=detector_name,
            model_version=model_version
        )

        # Initialize local detector
        self.local_detector = LocalFraudDetector(local_model_path)

        # Statistics
        self.total_predictions = 0
        self.aws_predictions = 0
        self.local_predictions = 0
        self.errors = 0

        trade_logger.logger.info(
            "Initialized production fraud detection service",
            extra={
                "aws_region": aws_region,
                "detector_name": detector_name,
                "fallback_to_local": fallback_to_local
            }
        )

    async def detect_fraud(
        self,
        signal: TradeSignal,
        customer_id: str,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> FraudScore:
        """Detect fraud using AWS Fraud Detector with local fallback."""
        self.total_predictions += 1

        try:
            # Try AWS Fraud Detector first
            fraud_score = await self.aws_client.get_fraud_prediction(
                signal, customer_id, additional_data
            )
            self.aws_predictions += 1

            # If AWS score is low confidence and fallback is enabled, use local
            # model
            if (self.fallback_to_local and
                fraud_score.confidence < 0.7 and
                    fraud_score.risk_level == FraudRiskLevel.LOW):

                local_score = self.local_detector.predict_fraud(
                    signal, additional_data)
                self.local_predictions += 1

                # Use local score if it's higher risk
                if local_score.score > fraud_score.score:
                    fraud_score = local_score
                    fraud_score.metadata = fraud_score.metadata or {}
                    fraud_score.metadata["source"] = "local_fallback"

            # Log prediction
            trade_logger.logger.info(
                "Fraud prediction completed",
                extra={
                    "signal_id": fraud_score.signal_id,
                    "risk_level": fraud_score.risk_level.value,
                    "score": fraud_score.score,
                    "fraud_type": fraud_score.fraud_type.value if fraud_score.fraud_type else None,
                    "confidence": fraud_score.confidence})

            return fraud_score

        except Exception as e:
            self.errors += 1
            trade_logger.logger.error(f"Fraud detection error: {e}")

            # Fallback to local model on error
            if self.fallback_to_local:
                try:
                    fraud_score = self.local_detector.predict_fraud(
                        signal, additional_data)
                    fraud_score.metadata = fraud_score.metadata or {}
                    fraud_score.metadata["source"] = "local_error_fallback"
                    fraud_score.metadata["error"] = str(e)

                    self.local_predictions += 1
                    return fraud_score
                except Exception as local_error:
                    trade_logger.logger.error(
                        f"Local fallback error: {local_error}")

            # Return default low-risk score
            return FraudScore(
                signal_id=str(signal.timestamp.timestamp()),
                risk_level=FraudRiskLevel.LOW,
                score=0.1,
                confidence=0.0,
                metadata={"error": str(e), "source": "default"}
            )

    def get_statistics(self) -> Dict[str, Any]:
        """Get fraud detection statistics."""
        return {
            "total_predictions": self.total_predictions,
            "aws_predictions": self.aws_predictions,
            "local_predictions": self.local_predictions,
            "errors": self.errors,
            "aws_success_rate": self.aws_predictions / max(1, self.total_predictions),
            "local_success_rate": self.local_predictions / max(1, self.total_predictions),
            "error_rate": self.errors / max(1, self.total_predictions)
        }

    def train_local_model(self, training_data: List[Dict[str, Any]]) -> None:
        """Train the local fraud detection model."""
        self.local_detector.train_model(training_data)

    def save_local_model(self, path: str) -> None:
        """Save the local fraud detection model."""
        self.local_detector.save_model(path)

    def load_local_model(self, path: str) -> None:
        """Load the local fraud detection model."""
        self.local_detector.load_model(path)
