"""Technical indicators calculation."""

import pandas as pd
import numpy as np
# import talib  # Commented out due to Python 3.13 compatibility issues
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from trading.schemas import MarketData, TechnicalIndicators
from trading.logging_utils import TradingLogger

data_logger = TradingLogger("trading.data")


class TechnicalIndicatorsCalculator:
    """Calculate technical indicators from market data."""

    def __init__(self):
        self.indicators_config = {
            'rsi': {'period': 14},
            'macd': {'fast': 12, 'slow': 26, 'signal': 9},
            'bb': {'period': 20, 'std': 2},
            'atr': {'period': 14},
            'sma': {'periods': [20, 50]},
            'ema': {'periods': [12, 26]},
            'volume_sma': {'period': 20}
        }

    def calculate_all_indicators(
        self,
        market_data: List[MarketData],
        symbol: str
    ) -> List[TechnicalIndicators]:
        """Calculate all technical indicators for market data."""
        try:
            # Convert to DataFrame
            df = self._market_data_to_dataframe(market_data)

            if df.empty or len(df) < 50:  # Need sufficient data
                data_logger.logger.warning(
                    "Insufficient data for indicators",
                    symbol=symbol,
                    data_points=len(df)
                )
                return []

            # Calculate indicators
            indicators = []

            for timestamp, row in df.iterrows():
                # Get data up to current timestamp
                current_data = df.loc[:timestamp]

                if len(current_data) < 50:
                    continue

                indicator = TechnicalIndicators(
                    symbol=symbol,
                    timestamp=timestamp,
                    rsi=self._calculate_rsi(current_data),
                    macd=self._calculate_macd(current_data),
                    macd_signal=self._calculate_macd_signal(current_data),
                    macd_histogram=self._calculate_macd_histogram(current_data),
                    bb_upper=self._calculate_bb_upper(current_data),
                    bb_middle=self._calculate_bb_middle(current_data),
                    bb_lower=self._calculate_bb_lower(current_data),
                    atr=self._calculate_atr(current_data),
                    sma_20=self._calculate_sma(current_data, 20),
                    sma_50=self._calculate_sma(current_data, 50),
                    ema_12=self._calculate_ema(current_data, 12),
                    ema_26=self._calculate_ema(current_data, 26),
                    volume_sma=self._calculate_volume_sma(current_data),
                    volatility=self._calculate_volatility(current_data)
                )

                indicators.append(indicator)

            data_logger.logger.info(
                "Technical indicators calculated",
                symbol=symbol,
                count=len(indicators)
            )

            return indicators

        except Exception as e:
            data_logger.log_error(
                "Indicators calculation error",
                f"Failed to calculate indicators for {symbol}: {str(e)}",
                symbol=symbol
            )
            return []

    def _market_data_to_dataframe(
            self, market_data: List[MarketData]) -> pd.DataFrame:
        """Convert market data to DataFrame."""
        data = []
        for item in market_data:
            data.append({
                'timestamp': item.timestamp,
                'open': item.open,
                'high': item.high,
                'low': item.low,
                'close': item.close,
                'volume': item.volume
            })

        df = pd.DataFrame(data)
        df.set_index('timestamp', inplace=True)
        df.sort_index(inplace=True)
        return df

    def _calculate_rsi(
            self,
            data: pd.DataFrame,
            period: int = 14) -> Optional[float]:
        """Calculate RSI."""
        try:
            if len(data) < period + 1:
                return None

            closes = data['close'].values
            rsi = talib.RSI(closes, timeperiod=period)
            return float(rsi[-1]) if not np.isnan(rsi[-1]) else None

        except Exception:
            return None

    def _calculate_macd(self, data: pd.DataFrame) -> Optional[float]:
        """Calculate MACD."""
        try:
            if len(data) < 26:
                return None

            closes = data['close'].values
            macd, signal, histogram = talib.MACD(
                closes,
                fastperiod=12,
                slowperiod=26,
                signalperiod=9
            )
            return float(macd[-1]) if not np.isnan(macd[-1]) else None

        except Exception:
            return None

    def _calculate_macd_signal(self, data: pd.DataFrame) -> Optional[float]:
        """Calculate MACD signal line."""
        try:
            if len(data) < 26:
                return None

            closes = data['close'].values
            macd, signal, histogram = talib.MACD(
                closes,
                fastperiod=12,
                slowperiod=26,
                signalperiod=9
            )
            return float(signal[-1]) if not np.isnan(signal[-1]) else None

        except Exception:
            return None

    def _calculate_macd_histogram(self, data: pd.DataFrame) -> Optional[float]:
        """Calculate MACD histogram."""
        try:
            if len(data) < 26:
                return None

            closes = data['close'].values
            macd, signal, histogram = talib.MACD(
                closes,
                fastperiod=12,
                slowperiod=26,
                signalperiod=9
            )
            return float(
                histogram[-1]) if not np.isnan(histogram[-1]) else None

        except Exception:
            return None

    def _calculate_bb_upper(
            self,
            data: pd.DataFrame,
            period: int = 20,
            std: float = 2) -> Optional[float]:
        """Calculate Bollinger Bands upper."""
        try:
            if len(data) < period:
                return None

            closes = data['close'].values
            upper, middle, lower = talib.BBANDS(
                closes,
                timeperiod=period,
                nbdevup=std,
                nbdevdn=std
            )
            return float(upper[-1]) if not np.isnan(upper[-1]) else None

        except Exception:
            return None

    def _calculate_bb_middle(
            self,
            data: pd.DataFrame,
            period: int = 20) -> Optional[float]:
        """Calculate Bollinger Bands middle."""
        try:
            if len(data) < period:
                return None

            closes = data['close'].values
            upper, middle, lower = talib.BBANDS(closes, timeperiod=period)
            return float(middle[-1]) if not np.isnan(middle[-1]) else None

        except Exception:
            return None

    def _calculate_bb_lower(
            self,
            data: pd.DataFrame,
            period: int = 20,
            std: float = 2) -> Optional[float]:
        """Calculate Bollinger Bands lower."""
        try:
            if len(data) < period:
                return None

            closes = data['close'].values
            upper, middle, lower = talib.BBANDS(
                closes,
                timeperiod=period,
                nbdevup=std,
                nbdevdn=std
            )
            return float(lower[-1]) if not np.isnan(lower[-1]) else None

        except Exception:
            return None

    def _calculate_atr(
            self,
            data: pd.DataFrame,
            period: int = 14) -> Optional[float]:
        """Calculate Average True Range."""
        try:
            if len(data) < period + 1:
                return None

            high = data['high'].values
            low = data['low'].values
            close = data['close'].values

            atr = talib.ATR(high, low, close, timeperiod=period)
            return float(atr[-1]) if not np.isnan(atr[-1]) else None

        except Exception:
            return None

    def _calculate_sma(
            self,
            data: pd.DataFrame,
            period: int) -> Optional[float]:
        """Calculate Simple Moving Average."""
        try:
            if len(data) < period:
                return None

            closes = data['close'].values
            sma = talib.SMA(closes, timeperiod=period)
            return float(sma[-1]) if not np.isnan(sma[-1]) else None

        except Exception:
            return None

    def _calculate_ema(
            self,
            data: pd.DataFrame,
            period: int) -> Optional[float]:
        """Calculate Exponential Moving Average."""
        try:
            if len(data) < period:
                return None

            closes = data['close'].values
            ema = talib.EMA(closes, timeperiod=period)
            return float(ema[-1]) if not np.isnan(ema[-1]) else None

        except Exception:
            return None

    def _calculate_volume_sma(
            self,
            data: pd.DataFrame,
            period: int = 20) -> Optional[float]:
        """Calculate Volume Simple Moving Average."""
        try:
            if len(data) < period:
                return None

            volumes = data['volume'].values
            volume_sma = talib.SMA(volumes, timeperiod=period)
            return float(
                volume_sma[-1]) if not np.isnan(volume_sma[-1]) else None

        except Exception:
            return None

    def _calculate_volatility(
            self,
            data: pd.DataFrame,
            period: int = 20) -> Optional[float]:
        """Calculate volatility (standard deviation of returns)."""
        try:
            if len(data) < period + 1:
                return None

            closes = data['close'].values
            returns = np.diff(np.log(closes))

            if len(returns) < period:
                return None

            volatility = np.std(returns[-period:]) * np.sqrt(252)  # Annualized
            return float(volatility) if not np.isnan(volatility) else None

        except Exception:
            return None

    def calculate_custom_indicator(
        self,
        data: pd.DataFrame,
        indicator_name: str,
        **kwargs
    ) -> Optional[float]:
        """Calculate custom indicator."""
        try:
            if indicator_name == "williams_r":
                return self._calculate_williams_r(data, **kwargs)
            elif indicator_name == "stochastic":
                return self._calculate_stochastic(data, **kwargs)
            elif indicator_name == "cci":
                return self._calculate_cci(data, **kwargs)
            else:
                data_logger.logger.warning(
                    f"Unknown indicator: {indicator_name}")
                return None

        except Exception as e:
            data_logger.log_error(
                "Custom indicator error",
                f"Failed to calculate {indicator_name}: {str(e)}"
            )
            return None

    def _calculate_williams_r(
            self,
            data: pd.DataFrame,
            period: int = 14) -> Optional[float]:
        """Calculate Williams %R."""
        try:
            if len(data) < period:
                return None

            high = data['high'].values
            low = data['low'].values
            close = data['close'].values

            wr = talib.WILLR(high, low, close, timeperiod=period)
            return float(wr[-1]) if not np.isnan(wr[-1]) else None

        except Exception:
            return None

    def _calculate_stochastic(
            self,
            data: pd.DataFrame,
            k_period: int = 14,
            d_period: int = 3) -> Optional[float]:
        """Calculate Stochastic Oscillator."""
        try:
            if len(data) < k_period:
                return None

            high = data['high'].values
            low = data['low'].values
            close = data['close'].values

            slowk, slowd = talib.STOCH(high, low, close,
                                       fastk_period=k_period,
                                       slowk_period=d_period,
                                       slowd_period=d_period)

            return float(slowk[-1]) if not np.isnan(slowk[-1]) else None

        except Exception:
            return None

    def _calculate_cci(
            self,
            data: pd.DataFrame,
            period: int = 14) -> Optional[float]:
        """Calculate Commodity Channel Index."""
        try:
            if len(data) < period:
                return None

            high = data['high'].values
            low = data['low'].values
            close = data['close'].values

            cci = talib.CCI(high, low, close, timeperiod=period)
            return float(cci[-1]) if not np.isnan(cci[-1]) else None

        except Exception:
            return None


# Global indicators calculator instance
indicators_calculator = TechnicalIndicatorsCalculator()
