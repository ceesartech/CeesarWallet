"""Production-ready database schemas and data persistence layer."""

import asyncio
import json
import time
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import boto3
from botocore.exceptions import ClientError, BotoCoreError
import redis
# import aioredis  # Commented out due to Python 3.13 compatibility issues
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Boolean, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import hashlib
import pickle
import gzip

from trading.config import settings
from trading.schemas import TradeSignal, TradeExecution, Forecast, Position
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.database")


class DatabaseType(Enum):
    """Database type enumeration."""
    DYNAMODB = "dynamodb"
    REDIS = "redis"
    POSTGRESQL = "postgresql"
    MONGODB = "mongodb"


@dataclass
class DatabaseConfig:
    """Database configuration."""
    db_type: DatabaseType
    connection_string: str
    table_name: str
    region: Optional[str] = None
    access_key: Optional[str] = None
    secret_key: Optional[str] = None


class DynamoDBClient:
    """Production-ready DynamoDB client."""

    def __init__(self, region_name: str = "us-east-1"):
        self.region_name = region_name
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        self.dynamodb_client = boto3.client(
            'dynamodb', region_name=region_name)

        trade_logger.logger.info(
            f"Initialized DynamoDB client for region: {region_name}")

    async def create_table(
        self,
        table_name: str,
        partition_key: str,
        sort_key: Optional[str] = None,
        attributes: Optional[List[Dict[str, str]]] = None
    ) -> bool:
        """Create DynamoDB table."""
        try:
            # Define key schema
            key_schema = [
                {'AttributeName': partition_key, 'KeyType': 'HASH'}
            ]

            if sort_key:
                key_schema.append(
                    {'AttributeName': sort_key, 'KeyType': 'RANGE'})

            # Define attribute definitions
            attribute_definitions = [
                {'AttributeName': partition_key, 'AttributeType': 'S'}
            ]

            if sort_key:
                attribute_definitions.append(
                    {'AttributeName': sort_key, 'AttributeType': 'S'})

            if attributes:
                attribute_definitions.extend(attributes)

            # Create table
            table = self.dynamodb.create_table(
                TableName=table_name,
                KeySchema=key_schema,
                AttributeDefinitions=attribute_definitions,
                BillingMode='PAY_PER_REQUEST'
            )

            # Wait for table to be created
            table.wait_until_exists()

            trade_logger.logger.info(f"Created DynamoDB table: {table_name}")
            return True

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceInUseException':
                trade_logger.logger.info(
                    f"DynamoDB table already exists: {table_name}")
                return True
            else:
                trade_logger.logger.error(
                    f"Failed to create DynamoDB table: {e}")
                return False

    async def put_item(self, table_name: str, item: Dict[str, Any]) -> bool:
        """Put item in DynamoDB table."""
        try:
            table = self.dynamodb.Table(table_name)
            table.put_item(Item=item)
            return True

        except ClientError as e:
            trade_logger.logger.error(f"Failed to put item in DynamoDB: {e}")
            return False

    async def get_item(self, table_name: str,
                       key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get item from DynamoDB table."""
        try:
            table = self.dynamodb.Table(table_name)
            response = table.get_item(Key=key)
            return response.get('Item')

        except ClientError as e:
            trade_logger.logger.error(f"Failed to get item from DynamoDB: {e}")
            return None

    async def query_items(
        self,
        table_name: str,
        partition_key: str,
        partition_value: str,
        sort_key: Optional[str] = None,
        sort_value: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Query items from DynamoDB table."""
        try:
            table = self.dynamodb.Table(table_name)

            query_params = {
                'KeyConditionExpression': f"{partition_key} = :pk"
            }

            expression_values = {':pk': partition_value}

            if sort_key and sort_value:
                query_params['KeyConditionExpression'] += f" AND {sort_key} = :sk"
                expression_values[':sk'] = sort_value

            query_params['ExpressionAttributeValues'] = expression_values

            if limit:
                query_params['Limit'] = limit

            response = table.query(**query_params)
            return response.get('Items', [])

        except ClientError as e:
            trade_logger.logger.error(f"Failed to query DynamoDB: {e}")
            return []

    async def scan_table(
        self,
        table_name: str,
        filter_expression: Optional[str] = None,
        expression_values: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Scan DynamoDB table."""
        try:
            table = self.dynamodb.Table(table_name)

            scan_params = {}

            if filter_expression:
                scan_params['FilterExpression'] = filter_expression

            if expression_values:
                scan_params['ExpressionAttributeValues'] = expression_values

            if limit:
                scan_params['Limit'] = limit

            response = table.scan(**scan_params)
            return response.get('Items', [])

        except ClientError as e:
            trade_logger.logger.error(f"Failed to scan DynamoDB: {e}")
            return []


class RedisClient:
    """Production-ready Redis client."""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis_client = redis.from_url(redis_url, decode_responses=True)

        trade_logger.logger.info(f"Initialized Redis client: {redis_url}")

    async def set(
            self,
            key: str,
            value: Any,
            ttl: Optional[int] = None) -> bool:
        """Set key-value pair in Redis."""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)

            if ttl:
                self.redis_client.setex(key, ttl, value)
            else:
                self.redis_client.set(key, value)

            return True

        except Exception as e:
            trade_logger.logger.error(f"Failed to set Redis key: {e}")
            return False

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis."""
        try:
            value = self.redis_client.get(key)
            if value is None:
                return None

            # Try to parse as JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        except Exception as e:
            trade_logger.logger.error(f"Failed to get Redis key: {e}")
            return None

    async def delete(self, key: str) -> bool:
        """Delete key from Redis."""
        try:
            self.redis_client.delete(key)
            return True

        except Exception as e:
            trade_logger.logger.error(f"Failed to delete Redis key: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis."""
        try:
            return bool(self.redis_client.exists(key))

        except Exception as e:
            trade_logger.logger.error(
                f"Failed to check Redis key existence: {e}")
            return False

    async def hset(self, name: str, mapping: Dict[str, Any]) -> bool:
        """Set hash fields in Redis."""
        try:
            # Convert values to strings
            str_mapping = {
                k: json.dumps(v) if isinstance(
                    v, (dict, list)) else str(v) for k, v in mapping.items()}

            self.redis_client.hset(name, mapping=str_mapping)
            return True

        except Exception as e:
            trade_logger.logger.error(f"Failed to set Redis hash: {e}")
            return False

    async def hget(self, name: str, key: str) -> Optional[Any]:
        """Get hash field from Redis."""
        try:
            value = self.redis_client.hget(name, key)
            if value is None:
                return None

            # Try to parse as JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        except Exception as e:
            trade_logger.logger.error(f"Failed to get Redis hash field: {e}")
            return None

    async def hgetall(self, name: str) -> Dict[str, Any]:
        """Get all hash fields from Redis."""
        try:
            hash_data = self.redis_client.hgetall(name)

            # Parse JSON values
            parsed_data = {}
            for k, v in hash_data.items():
                try:
                    parsed_data[k] = json.loads(v)
                except json.JSONDecodeError:
                    parsed_data[k] = v

            return parsed_data

        except Exception as e:
            trade_logger.logger.error(f"Failed to get Redis hash: {e}")
            return {}


class PostgreSQLClient:
    """Production-ready PostgreSQL client."""

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.engine = create_engine(connection_string)
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine)
        self.Base = declarative_base()

        trade_logger.logger.info("Initialized PostgreSQL client")

    def create_tables(self) -> None:
        """Create all tables."""
        self.Base.metadata.create_all(bind=self.engine)
        trade_logger.logger.info("Created PostgreSQL tables")

    def get_session(self):
        """Get database session."""
        return self.SessionLocal()


# Database Models
class TradeSignalModel:
    """Trade signal database model."""

    def __init__(self, db_client):
        self.db_client = db_client

    async def save_signal(self, signal: TradeSignal) -> bool:
        """Save trade signal to database."""
        try:
            signal_data = {
                "signal_id": str(uuid.uuid4()),
                "symbol": signal.symbol,
                "side": signal.side.value,
                "quantity": float(signal.quantity),
                "price": float(signal.price) if signal.price else None,
                "order_type": signal.order_type.value,
                "stop_loss": float(signal.stop_loss) if signal.stop_loss else None,
                "take_profit": float(signal.take_profit) if signal.take_profit else None,
                "confidence": float(signal.confidence) if signal.confidence else None,
                "timestamp": signal.timestamp.isoformat(),
                "model_name": signal.model_name,
                "metadata": json.dumps(signal.metadata) if signal.metadata else None
            }

            if isinstance(self.db_client, DynamoDBClient):
                return await self.db_client.put_item("trade_signals", signal_data)
            elif isinstance(self.db_client, RedisClient):
                return await self.db_client.set(f"signal:{signal_data['signal_id']}", signal_data, ttl=86400)

            return False

        except Exception as e:
            trade_logger.logger.error(f"Failed to save trade signal: {e}")
            return False

    async def get_signal(self, signal_id: str) -> Optional[TradeSignal]:
        """Get trade signal from database."""
        try:
            if isinstance(self.db_client, DynamoDBClient):
                signal_data = await self.db_client.get_item("trade_signals", {"signal_id": signal_id})
            elif isinstance(self.db_client, RedisClient):
                signal_data = await self.db_client.get(f"signal:{signal_id}")
            else:
                return None

            if not signal_data:
                return None

            # Convert back to TradeSignal object
            return TradeSignal(
                symbol=signal_data["symbol"],
                side=signal_data["side"],
                quantity=signal_data["quantity"],
                price=signal_data.get("price"),
                order_type=signal_data["order_type"],
                stop_loss=signal_data.get("stop_loss"),
                take_profit=signal_data.get("take_profit"),
                confidence=signal_data.get("confidence"),
                timestamp=datetime.fromisoformat(
                    signal_data["timestamp"]),
                model_name=signal_data.get("model_name"),
                metadata=json.loads(
                    signal_data["metadata"]) if signal_data.get("metadata") else None)

        except Exception as e:
            trade_logger.logger.error(f"Failed to get trade signal: {e}")
            return None


class TradeExecutionModel:
    """Trade execution database model."""

    def __init__(self, db_client):
        self.db_client = db_client

    async def save_execution(self, execution: TradeExecution) -> bool:
        """Save trade execution to database."""
        try:
            execution_data = {
                "execution_id": execution.execution_id,
                "signal_id": str(
                    uuid.uuid4()),
                "symbol": execution.signal.symbol,
                "side": execution.signal.side.value,
                "executed_price": float(
                    execution.executed_price),
                "executed_quantity": float(
                    execution.executed_quantity),
                "execution_time": execution.execution_time.isoformat(),
                "fees": float(
                    execution.fees),
                "status": execution.status.value,
                "broker_order_id": execution.broker_order_id,
                "metadata": json.dumps(
                    execution.metadata) if execution.metadata else None}

            if isinstance(self.db_client, DynamoDBClient):
                return await self.db_client.put_item("trade_executions", execution_data)
            elif isinstance(self.db_client, RedisClient):
                return await self.db_client.set(f"execution:{execution.execution_id}", execution_data, ttl=86400)

            return False

        except Exception as e:
            trade_logger.logger.error(f"Failed to save trade execution: {e}")
            return False

    async def get_execution(
            self,
            execution_id: str) -> Optional[TradeExecution]:
        """Get trade execution from database."""
        try:
            if isinstance(self.db_client, DynamoDBClient):
                execution_data = await self.db_client.get_item("trade_executions", {"execution_id": execution_id})
            elif isinstance(self.db_client, RedisClient):
                execution_data = await self.db_client.get(f"execution:{execution_id}")
            else:
                return None

            if not execution_data:
                return None

            # Convert back to TradeExecution object
            return TradeExecution(
                signal=TradeSignal(
                    symbol=execution_data["symbol"],
                    side=execution_data["side"],
                    quantity=execution_data["executed_quantity"],
                    timestamp=datetime.fromisoformat(
                        execution_data["execution_time"])),
                execution_id=execution_data["execution_id"],
                executed_price=execution_data["executed_price"],
                executed_quantity=execution_data["executed_quantity"],
                execution_time=datetime.fromisoformat(
                    execution_data["execution_time"]),
                fees=execution_data["fees"],
                status=execution_data["status"],
                broker_order_id=execution_data["broker_order_id"],
                metadata=json.loads(
                    execution_data["metadata"]) if execution_data.get("metadata") else None)

        except Exception as e:
            trade_logger.logger.error(f"Failed to get trade execution: {e}")
            return None


class ForecastModel:
    """Forecast database model."""

    def __init__(self, db_client):
        self.db_client = db_client

    async def save_forecast(self, forecast: Forecast) -> bool:
        """Save forecast to database."""
        try:
            forecast_data = {
                "forecast_id": str(
                    uuid.uuid4()),
                "symbol": forecast.symbol,
                "timestamp": forecast.timestamp.isoformat(),
                "horizon": forecast.horizon,
                "values": json.dumps(
                    forecast.values),
                "confidence": float(
                    forecast.confidence) if forecast.confidence else None,
                "model_name": forecast.model_name,
                "metadata": json.dumps(
                    forecast.metadata) if forecast.metadata else None}

            if isinstance(self.db_client, DynamoDBClient):
                return await self.db_client.put_item("forecasts", forecast_data)
            elif isinstance(self.db_client, RedisClient):
                return await self.db_client.set(f"forecast:{forecast_data['forecast_id']}", forecast_data, ttl=3600)

            return False

        except Exception as e:
            trade_logger.logger.error(f"Failed to save forecast: {e}")
            return False

    async def get_latest_forecast(self, symbol: str) -> Optional[Forecast]:
        """Get latest forecast for symbol."""
        try:
            if isinstance(self.db_client, DynamoDBClient):
                forecasts = await self.db_client.query_items(
                    "forecasts",
                    "symbol",
                    symbol,
                    limit=1
                )
            elif isinstance(self.db_client, RedisClient):
                forecast_data = await self.db_client.get(f"latest_forecast:{symbol}")
                forecasts = [forecast_data] if forecast_data else []
            else:
                return None

            if not forecasts:
                return None

            forecast_data = forecasts[0]

            # Convert back to Forecast object
            return Forecast(
                symbol=forecast_data["symbol"],
                timestamp=datetime.fromisoformat(
                    forecast_data["timestamp"]),
                horizon=forecast_data["horizon"],
                values=json.loads(
                    forecast_data["values"]),
                confidence=forecast_data.get("confidence"),
                model_name=forecast_data.get("model_name"),
                metadata=json.loads(
                    forecast_data["metadata"]) if forecast_data.get("metadata") else None)

        except Exception as e:
            trade_logger.logger.error(f"Failed to get latest forecast: {e}")
            return None


class ProductionDatabaseService:
    """Production-ready database service."""

    def __init__(
        self,
        primary_db_config: DatabaseConfig,
        cache_db_config: Optional[DatabaseConfig] = None
    ):
        self.primary_db_config = primary_db_config
        self.cache_db_config = cache_db_config

        # Initialize primary database client
        if primary_db_config.db_type == DatabaseType.DYNAMODB:
            self.primary_client = DynamoDBClient(primary_db_config.region)
        elif primary_db_config.db_type == DatabaseType.REDIS:
            self.primary_client = RedisClient(
                primary_db_config.connection_string)
        elif primary_db_config.db_type == DatabaseType.POSTGRESQL:
            self.primary_client = PostgreSQLClient(
                primary_db_config.connection_string)
        else:
            raise ValueError(
                f"Unsupported primary database type: {
                    primary_db_config.db_type}")

        # Initialize cache database client
        self.cache_client = None
        if cache_db_config:
            if cache_db_config.db_type == DatabaseType.REDIS:
                self.cache_client = RedisClient(
                    cache_db_config.connection_string)
            else:
                trade_logger.logger.warning("Cache database must be Redis")

        # Initialize models
        self.trade_signal_model = TradeSignalModel(self.primary_client)
        self.trade_execution_model = TradeExecutionModel(self.primary_client)
        self.forecast_model = ForecastModel(self.primary_client)

        trade_logger.logger.info(
            "Initialized production database service",
            extra={
                "primary_db": primary_db_config.db_type.value,
                "cache_db": cache_db_config.db_type.value if cache_db_config else None})

    async def initialize_tables(self) -> None:
        """Initialize database tables."""
        try:
            if isinstance(self.primary_client, DynamoDBClient):
                # Create DynamoDB tables
                await self.primary_client.create_table(
                    "trade_signals",
                    "signal_id"
                )
                await self.primary_client.create_table(
                    "trade_executions",
                    "execution_id"
                )
                await self.primary_client.create_table(
                    "forecasts",
                    "symbol",
                    "timestamp"
                )

            elif isinstance(self.primary_client, PostgreSQLClient):
                # Create PostgreSQL tables
                self.primary_client.create_tables()

            trade_logger.logger.info("Database tables initialized")

        except Exception as e:
            trade_logger.logger.error(
                f"Failed to initialize database tables: {e}")
            raise

    async def save_trade_signal(self, signal: TradeSignal) -> bool:
        """Save trade signal."""
        success = await self.trade_signal_model.save_signal(signal)

        # Also cache in Redis if available
        if self.cache_client and success:
            await self.cache_client.set(
                f"signal:{signal.timestamp.timestamp()}",
                signal.to_dict(),
                ttl=3600
            )

        return success

    async def save_trade_execution(self, execution: TradeExecution) -> bool:
        """Save trade execution."""
        success = await self.trade_execution_model.save_execution(execution)

        # Also cache in Redis if available
        if self.cache_client and success:
            await self.cache_client.set(
                f"execution:{execution.execution_id}",
                execution.to_dict(),
                ttl=3600
            )

        return success

    async def save_forecast(self, forecast: Forecast) -> bool:
        """Save forecast."""
        success = await self.forecast_model.save_forecast(forecast)

        # Also cache in Redis if available
        if self.cache_client and success:
            await self.cache_client.set(
                f"latest_forecast:{forecast.symbol}",
                forecast.to_dict(),
                ttl=1800  # 30 minutes
            )

        return success

    async def get_trade_signal(self, signal_id: str) -> Optional[TradeSignal]:
        """Get trade signal."""
        # Try cache first
        if self.cache_client:
            cached_signal = await self.cache_client.get(f"signal:{signal_id}")
            if cached_signal:
                return TradeSignal.from_dict(cached_signal)

        # Get from primary database
        return await self.trade_signal_model.get_signal(signal_id)

    async def get_trade_execution(
            self, execution_id: str) -> Optional[TradeExecution]:
        """Get trade execution."""
        # Try cache first
        if self.cache_client:
            cached_execution = await self.cache_client.get(f"execution:{execution_id}")
            if cached_execution:
                return TradeExecution.from_dict(cached_execution)

        # Get from primary database
        return await self.trade_execution_model.get_execution(execution_id)

    async def get_latest_forecast(self, symbol: str) -> Optional[Forecast]:
        """Get latest forecast."""
        # Try cache first
        if self.cache_client:
            cached_forecast = await self.cache_client.get(f"latest_forecast:{symbol}")
            if cached_forecast:
                return Forecast.from_dict(cached_forecast)

        # Get from primary database
        return await self.forecast_model.get_latest_forecast(symbol)

    def get_statistics(self) -> Dict[str, Any]:
        """Get database statistics."""
        return {
            "primary_db_type": self.primary_db_config.db_type.value,
            "cache_db_type": self.cache_db_config.db_type.value if self.cache_db_config else None,
            "models_initialized": True}
