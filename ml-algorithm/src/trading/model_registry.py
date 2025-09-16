"""Model registry for managing ML models."""

import os
import json
import pickle
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field
import mlflow
import mlflow.pytorch
import torch
from trading.config import settings
from trading.logging_utils import get_logger

logger = get_logger("trading.model_registry")


class ModelMetadata(BaseModel):
    """Model metadata."""
    model_name: str
    version: str
    model_type: str
    symbol: str
    created_at: datetime
    accuracy: Optional[float] = None
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    training_data_size: int = 0
    validation_metrics: Dict[str, float] = Field(default_factory=dict)
    is_active: bool = True
    description: Optional[str] = None


class ModelRegistry:
    """Registry for managing ML models."""

    def __init__(self, s3_bucket: str = None, local_path: str = None):
        self.s3_bucket = s3_bucket or settings.model_bucket
        self.local_path = local_path or "./models"
        self.s3_client = boto3.client('s3', region_name=settings.aws_region)

        # Create local directory if it doesn't exist
        Path(self.local_path).mkdir(parents=True, exist_ok=True)

        # Initialize MLflow
        mlflow.set_tracking_uri("file://./mlruns")

    def save_model(
        self,
        model: Any,
        model_name: str,
        version: str,
        symbol: str,
        model_type: str,
        metadata: Dict[str, Any] = None,
        validation_metrics: Dict[str, float] = None
    ) -> str:
        """Save a model to the registry."""
        try:
            timestamp = datetime.now(timezone.utc)

            # Create model metadata
            model_metadata = ModelMetadata(
                model_name=model_name,
                version=version,
                model_type=model_type,
                symbol=symbol,
                created_at=timestamp,
                hyperparameters=metadata or {},
                validation_metrics=validation_metrics or {}
            )

            # Save locally first
            local_model_path = self._save_model_locally(
                model, model_name, version, model_metadata
            )

            # Upload to S3
            s3_path = self._upload_to_s3(local_model_path, model_name, version)

            # Log to MLflow
            self._log_to_mlflow(model, model_metadata, validation_metrics)

            logger.info(
                "Model saved successfully",
                model_name=model_name,
                version=version,
                symbol=symbol,
                s3_path=s3_path
            )

            return s3_path

        except Exception as e:
            logger.error(
                "Failed to save model",
                model_name=model_name,
                version=version,
                error=str(e)
            )
            raise

    def load_model(
        self,
        model_name: str,
        version: str = None,
        symbol: str = None
    ) -> tuple[Any, ModelMetadata]:
        """Load a model from the registry."""
        try:
            if version is None:
                version = self.get_latest_version(model_name, symbol)

            # Try to load from local cache first
            local_path = self._get_local_model_path(model_name, version)
            if os.path.exists(local_path):
                return self._load_from_local(local_path)

            # Load from S3
            s3_path = self._get_s3_model_path(model_name, version)
            return self._load_from_s3(s3_path)

        except Exception as e:
            logger.error(
                "Failed to load model",
                model_name=model_name,
                version=version,
                error=str(e)
            )
            raise

    def get_latest_version(self, model_name: str, symbol: str = None) -> str:
        """Get the latest version of a model."""
        try:
            # List models in S3
            prefix = f"{settings.model_prefix}{model_name}/"
            if symbol:
                prefix += f"{symbol}/"

            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket,
                Prefix=prefix
            )

            if 'Contents' not in response:
                raise ValueError(f"No models found for {model_name}")

            # Extract versions and find latest
            versions = []
            for obj in response['Contents']:
                key = obj['Key']
                if key.endswith('/metadata.json'):
                    version = key.split('/')[-2]
                    versions.append(version)

            if not versions:
                raise ValueError(f"No versions found for {model_name}")

            # Sort versions (assuming semantic versioning)
            versions.sort(key=lambda x: [int(v)
                          for v in x.split('.')], reverse=True)
            return versions[0]

        except Exception as e:
            logger.error(
                "Failed to get latest version",
                model_name=model_name,
                error=str(e)
            )
            raise

    def list_models(self, symbol: str = None) -> List[ModelMetadata]:
        """List all models in the registry."""
        try:
            models = []
            prefix = settings.model_prefix

            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket,
                Prefix=prefix
            )

            if 'Contents' not in response:
                return models

            for obj in response['Contents']:
                key = obj['Key']
                if key.endswith('/metadata.json'):
                    # Download metadata
                    metadata_obj = self.s3_client.get_object(
                        Bucket=self.s3_bucket,
                        Key=key
                    )
                    metadata_json = json.loads(metadata_obj['Body'].read())
                    metadata = ModelMetadata(**metadata_json)

                    if symbol is None or metadata.symbol == symbol:
                        models.append(metadata)

            return models

        except Exception as e:
            logger.error("Failed to list models", error=str(e))
            raise

    def delete_model(self, model_name: str, version: str) -> bool:
        """Delete a model from the registry."""
        try:
            # Delete from S3
            prefix = f"{settings.model_prefix}{model_name}/{version}/"

            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket,
                Prefix=prefix
            )

            if 'Contents' in response:
                for obj in response['Contents']:
                    self.s3_client.delete_object(
                        Bucket=self.s3_bucket,
                        Key=obj['Key']
                    )

            # Delete local files
            local_path = self._get_local_model_path(model_name, version)
            if os.path.exists(local_path):
                import shutil
                shutil.rmtree(local_path)

            logger.info(
                "Model deleted successfully",
                model_name=model_name,
                version=version
            )

            return True

        except Exception as e:
            logger.error(
                "Failed to delete model",
                model_name=model_name,
                version=version,
                error=str(e)
            )
            return False

    def _save_model_locally(
        self,
        model: Any,
        model_name: str,
        version: str,
        metadata: ModelMetadata
    ) -> str:
        """Save model locally."""
        model_dir = Path(self.local_path) / model_name / version
        model_dir.mkdir(parents=True, exist_ok=True)

        # Save model
        if isinstance(model, torch.nn.Module):
            torch.save(model.state_dict(), model_dir / "model.pth")
        else:
            with open(model_dir / "model.pkl", "wb") as f:
                pickle.dump(model, f)

        # Save metadata
        with open(model_dir / "metadata.json", "w") as f:
            f.write(metadata.json())

        return str(model_dir)

    def _upload_to_s3(
            self,
            local_path: str,
            model_name: str,
            version: str) -> str:
        """Upload model to S3."""
        model_dir = Path(local_path)

        for file_path in model_dir.rglob("*"):
            if file_path.is_file():
                relative_path = file_path.relative_to(model_dir)
                s3_key = f"{
                    settings.model_prefix}{model_name}/{version}/{relative_path}"

                self.s3_client.upload_file(
                    str(file_path),
                    self.s3_bucket,
                    s3_key
                )

        return f"s3://{self.s3_bucket}/{settings.model_prefix}{model_name}/{version}/"

    def _load_from_local(self, local_path: str) -> tuple[Any, ModelMetadata]:
        """Load model from local storage."""
        model_dir = Path(local_path)

        # Load metadata
        with open(model_dir / "metadata.json", "r") as f:
            metadata_json = json.load(f)
            metadata = ModelMetadata(**metadata_json)

        # Load model
        if (model_dir / "model.pth").exists():
            # PyTorch model
            model = torch.load(model_dir / "model.pth")
        else:
            # Pickle model
            with open(model_dir / "model.pkl", "rb") as f:
                model = pickle.load(f)

        return model, metadata

    def _load_from_s3(self, s3_path: str) -> tuple[Any, ModelMetadata]:
        """Load model from S3."""
        # Download model files
        bucket, key_prefix = s3_path.replace("s3://", "").split("/", 1)

        response = self.s3_client.list_objects_v2(
            Bucket=bucket,
            Prefix=key_prefix
        )

        if 'Contents' not in response:
            raise ValueError(f"No model found at {s3_path}")

        # Create local directory
        model_name = key_prefix.split("/")[-3]
        version = key_prefix.split("/")[-2]
        local_dir = Path(self.local_path) / model_name / version
        local_dir.mkdir(parents=True, exist_ok=True)

        # Download files
        for obj in response['Contents']:
            key = obj['Key']
            filename = key.split("/")[-1]
            local_path = local_dir / filename

            self.s3_client.download_file(bucket, key, str(local_path))

        return self._load_from_local(str(local_dir))

    def _get_local_model_path(self, model_name: str, version: str) -> str:
        """Get local model path."""
        return str(Path(self.local_path) / model_name / version)

    def _get_s3_model_path(self, model_name: str, version: str) -> str:
        """Get S3 model path."""
        return f"s3://{self.s3_bucket}/{settings.model_prefix}{model_name}/{version}/"

    def _log_to_mlflow(
        self,
        model: Any,
        metadata: ModelMetadata,
        validation_metrics: Dict[str, float] = None
    ) -> None:
        """Log model to MLflow."""
        try:
            with mlflow.start_run():
                # Log parameters
                mlflow.log_params(metadata.hyperparameters)

                # Log metrics
                if validation_metrics:
                    mlflow.log_metrics(validation_metrics)

                # Log model
                if isinstance(model, torch.nn.Module):
                    mlflow.pytorch.log_model(model, "model")
                else:
                    mlflow.sklearn.log_model(model, "model")

                # Log metadata
                mlflow.set_tag("model_name", metadata.model_name)
                mlflow.set_tag("version", metadata.version)
                mlflow.set_tag("symbol", metadata.symbol)
                mlflow.set_tag("model_type", metadata.model_type)

        except Exception as e:
            logger.warning("Failed to log to MLflow", error=str(e))


# Global model registry instance
model_registry = ModelRegistry()
