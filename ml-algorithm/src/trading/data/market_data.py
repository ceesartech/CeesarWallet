"""Market data processing and management."""

import yfinance as yf
import ccxt
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
import asyncio
import aiohttp
from dataclasses import dataclass
from trading.config import settings, AssetClass
from trading.schemas import MarketData, TechnicalIndicators
from trading.logging_utils import TradingLogger

data_logger = TradingLogger("trading.data")


@dataclass
class DataSource:
    """Data source configuration."""
    name: str
    asset_classes: List[AssetClass]
    rate_limit: int  # requests per minute
    supports_realtime: bool = False


class MarketDataProvider:
    """Base class for market data providers."""

    def __init__(self, source: DataSource):
        self.source = source
        self.rate_limit = source.rate_limit
        self.last_request_time = {}

    async def get_historical_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1m"
    ) -> List[MarketData]:
        """Get historical market data."""
        raise NotImplementedError

    async def get_realtime_data(self, symbol: str) -> MarketData:
        """Get real-time market data."""
        raise NotImplementedError

    def _rate_limit_check(self, symbol: str) -> None:
        """Check rate limiting."""
        now = datetime.now()
        if symbol in self.last_request_time:
            time_since_last = (
                now - self.last_request_time[symbol]).total_seconds()
            min_interval = 60 / self.rate_limit
            if time_since_last < min_interval:
                sleep_time = min_interval - time_since_last
                asyncio.sleep(sleep_time)

        self.last_request_time[symbol] = now


class YahooFinanceProvider(MarketDataProvider):
    """Yahoo Finance data provider."""

    def __init__(self):
        super().__init__(DataSource(
            name="yfinance",
            asset_classes=[AssetClass.EQUITY, AssetClass.CRYPTO],
            rate_limit=1000,
            supports_realtime=True
        ))

    async def get_historical_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1m"
    ) -> List[MarketData]:
        """Get historical data from Yahoo Finance."""
        try:
            self._rate_limit_check(symbol)

            # Map timeframe
            interval_map = {
                "1m": "1m",
                "5m": "5m",
                "15m": "15m",
                "30m": "30m",
                "1h": "1h",
                "1d": "1d"
            }

            interval = interval_map.get(timeframe, "1m")

            # Download data
            ticker = yf.Ticker(symbol)
            data = ticker.history(
                start=start_date,
                end=end_date,
                interval=interval
            )

            if data.empty:
                data_logger.log_error(
                    "No data retrieved",
                    f"No data found for {symbol}",
                    symbol=symbol
                )
                return []

            # Convert to MarketData objects
            market_data = []
            for timestamp, row in data.iterrows():
                market_data.append(MarketData(
                    symbol=symbol,
                    timestamp=timestamp.to_pydatetime().replace(tzinfo=timezone.utc),
                    open=float(row['Open']),
                    high=float(row['High']),
                    low=float(row['Low']),
                    close=float(row['Close']),
                    volume=float(row['Volume']),
                    asset_class=self._get_asset_class(symbol)
                ))

            data_logger.logger.info(
                "Historical data retrieved",
                symbol=symbol,
                count=len(market_data),
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat()
            )

            return market_data

        except Exception as e:
            data_logger.log_error(
                "Data retrieval error",
                f"Failed to get historical data for {symbol}: {str(e)}",
                symbol=symbol
            )
            return []

    async def get_realtime_data(self, symbol: str) -> Optional[MarketData]:
        """Get real-time data from Yahoo Finance."""
        try:
            self._rate_limit_check(symbol)

            ticker = yf.Ticker(symbol)
            info = ticker.info

            if not info or 'regularMarketPrice' not in info:
                return None

            now = datetime.now(timezone.utc)

            return MarketData(
                symbol=symbol,
                timestamp=now,
                open=float(info.get('open', info['regularMarketPrice'])),
                high=float(info.get('dayHigh', info['regularMarketPrice'])),
                low=float(info.get('dayLow', info['regularMarketPrice'])),
                close=float(info['regularMarketPrice']),
                volume=float(info.get('volume', 0)),
                asset_class=self._get_asset_class(symbol)
            )

        except Exception as e:
            data_logger.log_error(
                "Realtime data error",
                f"Failed to get real-time data for {symbol}: {str(e)}",
                symbol=symbol
            )
            return None

    def _get_asset_class(self, symbol: str) -> AssetClass:
        """Determine asset class from symbol."""
        if symbol.endswith('USD') or symbol.endswith(
                'EUR') or symbol.endswith('GBP'):
            return AssetClass.CRYPTO
        else:
            return AssetClass.EQUITY


class CCXTProvider(MarketDataProvider):
    """CCXT exchange data provider."""

    def __init__(self, exchange_name: str = "binance"):
        super().__init__(DataSource(
            name=f"ccxt_{exchange_name}",
            asset_classes=[AssetClass.CRYPTO],
            rate_limit=1200,
            supports_realtime=True
        ))

        self.exchange_name = exchange_name
        self.exchange = getattr(ccxt, exchange_name)()

    async def get_historical_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1m"
    ) -> List[MarketData]:
        """Get historical data from CCXT exchange."""
        try:
            self._rate_limit_check(symbol)

            # Convert timeframe
            timeframe_map = {
                "1m": "1m",
                "5m": "5m",
                "15m": "15m",
                "30m": "30m",
                "1h": "1h",
                "1d": "1d"
            }

            tf = timeframe_map.get(timeframe, "1m")

            # Convert dates to milliseconds
            since = int(start_date.timestamp() * 1000)
            limit = int(
                (end_date -
                 start_date).total_seconds() /
                60)  # Approximate

            # Fetch OHLCV data
            ohlcv = self.exchange.fetch_ohlcv(symbol, tf, since, limit)

            if not ohlcv:
                return []

            # Convert to MarketData objects
            market_data = []
            for candle in ohlcv:
                timestamp = datetime.fromtimestamp(
                    candle[0] / 1000, tz=timezone.utc)
                market_data.append(MarketData(
                    symbol=symbol,
                    timestamp=timestamp,
                    open=float(candle[1]),
                    high=float(candle[2]),
                    low=float(candle[3]),
                    close=float(candle[4]),
                    volume=float(candle[5]),
                    asset_class=AssetClass.CRYPTO
                ))

            data_logger.logger.info(
                "CCXT historical data retrieved",
                symbol=symbol,
                count=len(market_data),
                exchange=self.exchange_name
            )

            return market_data

        except Exception as e:
            data_logger.log_error(
                "CCXT data error",
                f"Failed to get historical data for {symbol}: {str(e)}",
                symbol=symbol
            )
            return []

    async def get_realtime_data(self, symbol: str) -> Optional[MarketData]:
        """Get real-time data from CCXT exchange."""
        try:
            self._rate_limit_check(symbol)

            ticker = self.exchange.fetch_ticker(symbol)

            if not ticker:
                return None

            now = datetime.now(timezone.utc)

            return MarketData(
                symbol=symbol,
                timestamp=now,
                open=float(ticker['open']),
                high=float(ticker['high']),
                low=float(ticker['low']),
                close=float(ticker['last']),
                volume=float(ticker['baseVolume']),
                asset_class=AssetClass.CRYPTO
            )

        except Exception as e:
            data_logger.log_error(
                "CCXT realtime error",
                f"Failed to get real-time data for {symbol}: {str(e)}",
                symbol=symbol
            )
            return None


class MarketDataManager:
    """Manages multiple data providers."""

    def __init__(self):
        self.providers = {
            "yfinance": YahooFinanceProvider(),
            "binance": CCXTProvider("binance"),
            "kraken": CCXTProvider("kraken")
        }
        self.is_running = False
        self.data_buffer = []

    async def get_historical_data(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1m",
        provider: str = None
    ) -> List[MarketData]:
        """Get historical data from appropriate provider."""
        if provider and provider in self.providers:
            return await self.providers[provider].get_historical_data(
                symbol, start_date, end_date, timeframe
            )

        # Auto-select provider based on symbol
        if symbol.endswith('USD') or symbol.endswith(
                'EUR') or symbol.endswith('GBP'):
            provider = "binance"  # Crypto
        else:
            provider = "yfinance"  # Equity

        return await self.providers[provider].get_historical_data(
            symbol, start_date, end_date, timeframe
        )

    async def get_realtime_data(
        self,
        symbol: str,
        provider: str = None
    ) -> Optional[MarketData]:
        """Get real-time data from appropriate provider."""
        if provider and provider in self.providers:
            return await self.providers[provider].get_realtime_data(symbol)

        # Auto-select provider
        if symbol.endswith('USD') or symbol.endswith(
                'EUR') or symbol.endswith('GBP'):
            provider = "binance"
        else:
            provider = "yfinance"

        return await self.providers[provider].get_realtime_data(symbol)

    async def get_multiple_symbols(
        self,
        symbols: List[str],
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1m"
    ) -> Dict[str, List[MarketData]]:
        """Get data for multiple symbols concurrently."""
        tasks = []
        for symbol in symbols:
            task = self.get_historical_data(
                symbol, start_date, end_date, timeframe)
            tasks.append((symbol, task))

        results = {}
        for symbol, task in tasks:
            try:
                data = await task
                results[symbol] = data
            except Exception as e:
                data_logger.log_error(
                    "Multi-symbol data error",
                    f"Failed to get data for {symbol}: {str(e)}",
                    symbol=symbol
                )
                results[symbol] = []

        return results

    def _validate_data(self, data: Any) -> bool:
        """Validate market data format."""
        if isinstance(data, list):
            return all(isinstance(item, MarketData) for item in data)
        elif isinstance(data, MarketData):
            return True
        elif isinstance(data, dict):
            required_fields = [
                'symbol',
                'timestamp',
                'open',
                'high',
                'low',
                'close',
                'volume']
            
            # Check if all required fields are present
            if not all(field in data for field in required_fields):
                return False
            
            # Validate field values
            try:
                # Check numeric fields are positive
                numeric_fields = ['open', 'high', 'low', 'close', 'volume']
                for field in numeric_fields:
                    value = data[field]
                    if not isinstance(value, (int, float)) or value <= 0:
                        return False
                
                # Check high >= low
                if data['high'] < data['low']:
                    return False
                
                # Check high >= open and high >= close
                if data['high'] < data['open'] or data['high'] < data['close']:
                    return False
                
                # Check low <= open and low <= close
                if data['low'] > data['open'] or data['low'] > data['close']:
                    return False
                
                return True
            except (TypeError, ValueError):
                return False
        return False


# Global data manager instance
data_manager = MarketDataManager()
