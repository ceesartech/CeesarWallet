"""Production-ready monitoring and alerting system with CloudWatch integration."""

import asyncio
import json
import time
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import boto3
from botocore.exceptions import ClientError, BotoCoreError
import psutil
import threading
from collections import defaultdict, deque
import logging
from prometheus_client import Counter, Histogram, Gauge, start_http_server, CollectorRegistry
import redis
# from datadog import initialize, statsd  # Commented out - optional dependency

from trading.config import settings
from trading.logging_utils import TradingLogger

trade_logger = TradingLogger("trading.monitoring")


class MetricType(Enum):
    """Metric type enumeration."""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


class AlertSeverity(Enum):
    """Alert severity enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Metric:
    """Metric data class."""
    name: str
    value: float
    metric_type: MetricType
    labels: Dict[str, str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)
        if self.labels is None:
            self.labels = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = asdict(self)
        data['metric_type'] = self.metric_type.value
        data['timestamp'] = self.timestamp.isoformat()
        return data


@dataclass
class Alert:
    """Alert data class."""
    alert_id: str
    title: str
    message: str
    severity: AlertSeverity
    metric_name: str
    threshold_value: float
    current_value: float
    timestamp: datetime = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = asdict(self)
        data['severity'] = self.severity.value
        data['timestamp'] = self.timestamp.isoformat()
        data['resolved_at'] = self.resolved_at.isoformat(
        ) if self.resolved_at else None
        return data


class CloudWatchMetricsClient:
    """Production-ready CloudWatch metrics client."""

    def __init__(
        self,
        region_name: str = "us-east-1",
        namespace: str = "CeesarWallet/Trading"
    ):
        self.region_name = region_name
        self.namespace = namespace

        # Initialize CloudWatch client
        self.cloudwatch = boto3.client(
            'cloudwatch',
            region_name=region_name
        )

        # Metric buffer for batch sending
        self.metric_buffer: List[Dict[str, Any]] = []
        self.buffer_size = 20
        self.buffer_timeout = 60  # seconds

        # Start background task for metric flushing
        self._start_background_flush()

        trade_logger.logger.info(
            "Initialized CloudWatch metrics client",
            extra={"region": region_name, "namespace": namespace}
        )

    def put_metric(
        self,
        metric_name: str,
        value: float,
        unit: str = "Count",
        dimensions: Optional[Dict[str, str]] = None
    ) -> None:
        """Put metric to CloudWatch."""
        try:
            metric_data = {
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit,
                'Timestamp': datetime.now(timezone.utc)
            }

            if dimensions:
                metric_data['Dimensions'] = [
                    {'Name': k, 'Value': v} for k, v in dimensions.items()
                ]

            self.metric_buffer.append(metric_data)

            # Send immediately if buffer is full
            if len(self.metric_buffer) >= self.buffer_size:
                self._flush_metrics()

        except Exception as e:
            trade_logger.logger.error(f"Failed to put metric: {e}")

    def _flush_metrics(self) -> None:
        """Flush metrics to CloudWatch."""
        if not self.metric_buffer:
            return

        try:
            # Split into batches of 20 (CloudWatch limit)
            for i in range(0, len(self.metric_buffer), 20):
                batch = self.metric_buffer[i:i + 20]

                self.cloudwatch.put_metric_data(
                    Namespace=self.namespace,
                    MetricData=batch
                )

            self.metric_buffer.clear()

        except ClientError as e:
            trade_logger.logger.error(
                f"CloudWatch put_metric_data failed: {e}")
        except Exception as e:
            trade_logger.logger.error(f"Metric flush error: {e}")

    def _start_background_flush(self) -> None:
        """Start background task for metric flushing."""
        def flush_worker():
            while True:
                time.sleep(self.buffer_timeout)
                self._flush_metrics()

        flush_thread = threading.Thread(target=flush_worker, daemon=True)
        flush_thread.start()


class PrometheusMetricsClient:
    """Production-ready Prometheus metrics client."""

    def __init__(self, port: int = 8000):
        self.port = port
        self.registry = CollectorRegistry()

        # Initialize metrics
        self.counters: Dict[str, Counter] = {}
        self.gauges: Dict[str, Gauge] = {}
        self.histograms: Dict[str, Histogram] = {}

        # Start HTTP server
        start_http_server(port, registry=self.registry)

        trade_logger.logger.info(
            f"Prometheus metrics server started on port {port}")

    def get_or_create_counter(
        self,
        name: str,
        description: str,
        labelnames: Optional[List[str]] = None
    ) -> Counter:
        """Get or create a counter metric."""
        if name not in self.counters:
            self.counters[name] = Counter(
                name,
                description,
                labelnames=labelnames or [],
                registry=self.registry
            )
        return self.counters[name]

    def get_or_create_gauge(
        self,
        name: str,
        description: str,
        labelnames: Optional[List[str]] = None
    ) -> Gauge:
        """Get or create a gauge metric."""
        if name not in self.gauges:
            self.gauges[name] = Gauge(
                name,
                description,
                labelnames=labelnames or [],
                registry=self.registry
            )
        return self.gauges[name]

    def get_or_create_histogram(
        self,
        name: str,
        description: str,
        labelnames: Optional[List[str]] = None,
        buckets: Optional[List[float]] = None
    ) -> Histogram:
        """Get or create a histogram metric."""
        if name not in self.histograms:
            self.histograms[name] = Histogram(
                name,
                description,
                labelnames=labelnames or [],
                buckets=buckets,
                registry=self.registry
            )
        return self.histograms[name]

    def increment_counter(self, name: str, value: float = 1.0,
                          labels: Optional[Dict[str, str]] = None) -> None:
        """Increment a counter metric."""
        counter = self.get_or_create_counter(name, f"Counter for {name}")
        if labels:
            counter.labels(**labels).inc(value)
        else:
            counter.inc(value)

    def set_gauge(self, name: str, value: float,
                  labels: Optional[Dict[str, str]] = None) -> None:
        """Set a gauge metric."""
        gauge = self.get_or_create_gauge(name, f"Gauge for {name}")
        if labels:
            gauge.labels(**labels).set(value)
        else:
            gauge.set(value)

    def observe_histogram(self, name: str, value: float,
                          labels: Optional[Dict[str, str]] = None) -> None:
        """Observe a histogram metric."""
        histogram = self.get_or_create_histogram(name, f"Histogram for {name}")
        if labels:
            histogram.labels(**labels).observe(value)
        else:
            histogram.observe(value)


class SystemMetricsCollector:
    """System metrics collector."""

    def __init__(self):
        self.metrics_buffer: deque = deque(maxlen=1000)

    def collect_system_metrics(self) -> List[Metric]:
        """Collect system metrics."""
        metrics = []

        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            metrics.append(Metric(
                name="system_cpu_percent",
                value=cpu_percent,
                metric_type=MetricType.GAUGE,
                labels={"host": "trading-server"}
            ))

            # Memory metrics
            memory = psutil.virtual_memory()
            metrics.append(Metric(
                name="system_memory_percent",
                value=memory.percent,
                metric_type=MetricType.GAUGE,
                labels={"host": "trading-server"}
            ))

            metrics.append(Metric(
                name="system_memory_available_bytes",
                value=memory.available,
                metric_type=MetricType.GAUGE,
                labels={"host": "trading-server"}
            ))

            # Disk metrics
            disk = psutil.disk_usage('/')
            metrics.append(Metric(
                name="system_disk_percent",
                value=(disk.used / disk.total) * 100,
                metric_type=MetricType.GAUGE,
                labels={"host": "trading-server", "mount": "/"}
            ))

            # Network metrics
            network = psutil.net_io_counters()
            metrics.append(Metric(
                name="system_network_bytes_sent",
                value=network.bytes_sent,
                metric_type=MetricType.COUNTER,
                labels={"host": "trading-server"}
            ))

            metrics.append(Metric(
                name="system_network_bytes_recv",
                value=network.bytes_recv,
                metric_type=MetricType.COUNTER,
                labels={"host": "trading-server"}
            ))

            # Process metrics
            process = psutil.Process()
            metrics.append(Metric(
                name="process_cpu_percent",
                value=process.cpu_percent(),
                metric_type=MetricType.GAUGE,
                labels={"host": "trading-server", "process": "trading-engine"}
            ))

            metrics.append(Metric(
                name="process_memory_bytes",
                value=process.memory_info().rss,
                metric_type=MetricType.GAUGE,
                labels={"host": "trading-server", "process": "trading-engine"}
            ))

        except Exception as e:
            trade_logger.logger.error(f"System metrics collection error: {e}")

        return metrics


class AlertManager:
    """Production-ready alert manager."""

    def __init__(
        self,
        cloudwatch_client: CloudWatchMetricsClient,
        sns_topic_arn: Optional[str] = None
    ):
        self.cloudwatch_client = cloudwatch_client
        self.sns_topic_arn = sns_topic_arn

        # Initialize SNS client if topic ARN provided
        if sns_topic_arn:
            self.sns = boto3.client('sns')

        # Alert rules
        self.alert_rules: Dict[str, Dict[str, Any]] = {}

        # Active alerts
        self.active_alerts: Dict[str, Alert] = {}

        # Alert history
        self.alert_history: deque = deque(maxlen=10000)

        trade_logger.logger.info("Initialized alert manager")

    def add_alert_rule(
        self,
        rule_name: str,
        metric_name: str,
        threshold: float,
        comparison: str,
        severity: AlertSeverity,
        duration: int = 0
    ) -> None:
        """Add alert rule."""
        self.alert_rules[rule_name] = {
            "metric_name": metric_name,
            "threshold": threshold,
            "comparison": comparison,  # "gt", "lt", "eq"
            "severity": severity,
            "duration": duration,
            "last_triggered": None
        }

        trade_logger.logger.info(
            f"Added alert rule: {rule_name}",
            extra={
                "metric_name": metric_name,
                "threshold": threshold,
                "severity": severity.value
            }
        )

    def check_metric(self, metric: Metric) -> None:
        """Check metric against alert rules."""
        for rule_name, rule in self.alert_rules.items():
            if rule["metric_name"] != metric.name:
                continue

            # Check threshold
            should_alert = False
            if rule["comparison"] == "gt" and metric.value > rule["threshold"]:
                should_alert = True
            elif rule["comparison"] == "lt" and metric.value < rule["threshold"]:
                should_alert = True
            elif rule["comparison"] == "eq" and metric.value == rule["threshold"]:
                should_alert = True

            if should_alert:
                self._trigger_alert(rule_name, rule, metric)
            else:
                self._resolve_alert(rule_name)

    def _trigger_alert(self, rule_name: str,
                       rule: Dict[str, Any], metric: Metric) -> None:
        """Trigger alert."""
        alert_id = f"{rule_name}_{metric.timestamp.timestamp()}"

        # Check if alert already exists
        if rule_name in self.active_alerts:
            return

        # Check duration requirement
        if rule["duration"] > 0:
            if rule["last_triggered"] is None:
                rule["last_triggered"] = metric.timestamp
                return

            duration_passed = (
                metric.timestamp -
                rule["last_triggered"]).total_seconds()
            if duration_passed < rule["duration"]:
                return

        # Create alert
        alert = Alert(
            alert_id=alert_id,
            title=f"Alert: {rule_name}",
            message=f"Metric {
                metric.name} value {
                metric.value} {
                rule['comparison']} threshold {
                    rule['threshold']}",
            severity=rule["severity"],
            metric_name=metric.name,
            threshold_value=rule["threshold"],
            current_value=metric.value,
            metadata={
                "rule_name": rule_name,
                "comparison": rule["comparison"],
                "labels": metric.labels})

        self.active_alerts[rule_name] = alert
        self.alert_history.append(alert)

        # Send notification
        self._send_notification(alert)

        trade_logger.logger.warning(
            f"Alert triggered: {rule_name}",
            extra={
                "alert_id": alert_id,
                "severity": alert.severity.value,
                "metric_name": metric.name,
                "current_value": metric.value,
                "threshold": rule["threshold"]
            }
        )

    def _resolve_alert(self, rule_name: str) -> None:
        """Resolve alert."""
        if rule_name in self.active_alerts:
            alert = self.active_alerts[rule_name]
            alert.resolved = True
            alert.resolved_at = datetime.now(timezone.utc)

            del self.active_alerts[rule_name]

            trade_logger.logger.info(f"Alert resolved: {rule_name}")

    def _send_notification(self, alert: Alert) -> None:
        """Send alert notification."""
        try:
            if self.sns_topic_arn:
                message = {
                    "alert_id": alert.alert_id,
                    "title": alert.title,
                    "message": alert.message,
                    "severity": alert.severity.value,
                    "metric_name": alert.metric_name,
                    "current_value": alert.current_value,
                    "threshold_value": alert.threshold_value,
                    "timestamp": alert.timestamp.isoformat()
                }

                self.sns.publish(
                    TopicArn=self.sns_topic_arn,
                    Message=json.dumps(message),
                    Subject=f"[{alert.severity.value.upper()}] {alert.title}"
                )

                trade_logger.logger.info(
                    f"Alert notification sent: {
                        alert.alert_id}")

        except Exception as e:
            trade_logger.logger.error(
                f"Failed to send alert notification: {e}")


class ProductionMonitoringService:
    """Production-ready monitoring service."""

    def __init__(
        self,
        cloudwatch_config: Optional[Dict[str, str]] = None,
        prometheus_port: int = 8000,
        sns_topic_arn: Optional[str] = None,
        redis_url: str = "redis://localhost:6379"
    ):
        # Initialize clients
        if cloudwatch_config:
            self.cloudwatch_client = CloudWatchMetricsClient(
                **cloudwatch_config)
        else:
            self.cloudwatch_client = CloudWatchMetricsClient()

        self.prometheus_client = PrometheusMetricsClient(prometheus_port)
        self.system_collector = SystemMetricsCollector()
        self.alert_manager = AlertManager(
            self.cloudwatch_client, sns_topic_arn)

        # Redis for metrics caching
        self.redis_client = redis.from_url(redis_url, decode_responses=True)

        # Metrics storage
        self.metrics_buffer: deque = deque(maxlen=10000)

        # Background tasks
        self.is_running = False
        self.collection_interval = 30  # seconds

        # Initialize default alert rules
        self._setup_default_alerts()

        trade_logger.logger.info("Initialized production monitoring service")

    def _setup_default_alerts(self) -> None:
        """Setup default alert rules."""
        # CPU alerts
        self.alert_manager.add_alert_rule(
            "high_cpu_usage",
            "system_cpu_percent",
            80.0,
            "gt",
            AlertSeverity.HIGH,
            duration=300  # 5 minutes
        )

        # Memory alerts
        self.alert_manager.add_alert_rule(
            "high_memory_usage",
            "system_memory_percent",
            85.0,
            "gt",
            AlertSeverity.HIGH,
            duration=300
        )

        # Disk alerts
        self.alert_manager.add_alert_rule(
            "high_disk_usage",
            "system_disk_percent",
            90.0,
            "gt",
            AlertSeverity.CRITICAL,
            duration=60
        )

        # Trading-specific alerts
        self.alert_manager.add_alert_rule(
            "high_order_failure_rate",
            "order_failure_rate",
            10.0,
            "gt",
            AlertSeverity.HIGH,
            duration=60
        )

        self.alert_manager.add_alert_rule(
            "high_fraud_score_rate",
            "fraud_score_rate",
            5.0,
            "gt",
            AlertSeverity.MEDIUM,
            duration=300
        )

    async def start_monitoring(self) -> None:
        """Start monitoring service."""
        self.is_running = True

        # Start background tasks
        tasks = [
            asyncio.create_task(self._collect_metrics_loop()),
            asyncio.create_task(self._process_alerts_loop()),
            asyncio.create_task(self._flush_metrics_loop())
        ]

        trade_logger.logger.info("Started monitoring service")

        # Wait for all tasks
        await asyncio.gather(*tasks, return_exceptions=True)

    async def stop_monitoring(self) -> None:
        """Stop monitoring service."""
        self.is_running = False
        trade_logger.logger.info("Stopped monitoring service")

    async def _collect_metrics_loop(self) -> None:
        """Collect metrics in background loop."""
        while self.is_running:
            try:
                # Collect system metrics
                system_metrics = self.system_collector.collect_system_metrics()

                for metric in system_metrics:
                    await self.record_metric(metric)

                await asyncio.sleep(self.collection_interval)

            except Exception as e:
                trade_logger.logger.error(f"Metrics collection error: {e}")
                await asyncio.sleep(60)  # Wait longer on error

    async def _process_alerts_loop(self) -> None:
        """Process alerts in background loop."""
        while self.is_running:
            try:
                # Process recent metrics for alerts
                recent_metrics = list(
                    self.metrics_buffer)[-100:]  # Last 100 metrics

                for metric in recent_metrics:
                    self.alert_manager.check_metric(metric)

                await asyncio.sleep(10)  # Check alerts every 10 seconds

            except Exception as e:
                trade_logger.logger.error(f"Alert processing error: {e}")
                await asyncio.sleep(30)

    async def _flush_metrics_loop(self) -> None:
        """Flush metrics to external systems."""
        while self.is_running:
            try:
                # Flush CloudWatch metrics
                self.cloudwatch_client._flush_metrics()

                await asyncio.sleep(60)  # Flush every minute

            except Exception as e:
                trade_logger.logger.error(f"Metrics flush error: {e}")
                await asyncio.sleep(60)

    async def record_metric(self, metric: Metric) -> None:
        """Record a metric."""
        try:
            # Add to buffer
            self.metrics_buffer.append(metric)

            # Send to CloudWatch
            self.cloudwatch_client.put_metric(
                metric_name=metric.name,
                value=metric.value,
                dimensions=metric.labels
            )

            # Send to Prometheus
            if metric.metric_type == MetricType.COUNTER:
                self.prometheus_client.increment_counter(
                    metric.name,
                    metric.value,
                    metric.labels
                )
            elif metric.metric_type == MetricType.GAUGE:
                self.prometheus_client.set_gauge(
                    metric.name,
                    metric.value,
                    metric.labels
                )
            elif metric.metric_type == MetricType.HISTOGRAM:
                self.prometheus_client.observe_histogram(
                    metric.name,
                    metric.value,
                    metric.labels
                )

            # Cache in Redis
            self.redis_client.setex(
                f"metric:{metric.name}:latest",
                300,  # 5 minutes TTL
                json.dumps(metric.to_dict())
            )

        except Exception as e:
            trade_logger.logger.error(f"Failed to record metric: {e}")

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get metrics summary."""
        try:
            # Last 1000 metrics
            recent_metrics = list(self.metrics_buffer)[-1000:]

            # Group by metric name
            metric_groups = defaultdict(list)
            for metric in recent_metrics:
                metric_groups[metric.name].append(metric)

            summary = {}
            for name, metrics in metric_groups.items():
                values = [m.value for m in metrics]
                summary[name] = {
                    "count": len(values),
                    "min": min(values),
                    "max": max(values),
                    "avg": sum(values) / len(values),
                    "latest": values[-1] if values else 0
                }

            return summary

        except Exception as e:
            trade_logger.logger.error(f"Failed to get metrics summary: {e}")
            return {}

    def get_active_alerts(self) -> List[Alert]:
        """Get active alerts."""
        return list(self.alert_manager.active_alerts.values())

    def get_alert_history(self, limit: int = 100) -> List[Alert]:
        """Get alert history."""
        return list(self.alert_manager.alert_history)[-limit:]

    def get_statistics(self) -> Dict[str, Any]:
        """Get monitoring statistics."""
        return {
            "metrics_collected": len(self.metrics_buffer),
            "active_alerts": len(self.alert_manager.active_alerts),
            "total_alerts": len(self.alert_manager.alert_history),
            "alert_rules": len(self.alert_manager.alert_rules),
            "is_running": self.is_running
        }
