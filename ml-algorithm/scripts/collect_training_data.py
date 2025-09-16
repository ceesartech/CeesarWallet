#!/usr/bin/env python3
"""
Enhanced Training Data Collection Script
Collects comprehensive training data for ML models including market data,
alternative data, and technical indicators.
"""

import asyncio
import pandas as pd
import numpy as np
import yfinance as yf
import ccxt
import aiohttp
import json
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import logging
from pathlib import Path
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DataSource:
    """Data source configuration."""
    name: str
    asset_classes: List[str]
    rate_limit: int  # requests per minute
    supports_realtime: bool = False

class EnhancedDataCollector:
    """Enhanced data collector for comprehensive training data."""
    
    def __init__(self):
        self.data_sources = {
            "yfinance": DataSource("yfinance", ["equity", "etf"], 2000, True),
            "ccxt": DataSource("ccxt", ["crypto"], 1200, True),
            "alpha_vantage": DataSource("alpha_vantage", ["equity", "forex"], 5, False),
            "newsapi": DataSource("newsapi", ["news"], 1000, True),
            "fred": DataSource("fred", ["economic"], 120, False)
        }
        
        # Initialize exchanges
        self.exchanges = {
            "binance": ccxt.binance(),
            "coinbase": ccxt.coinbasepro(),
            "kraken": ccxt.kraken()
        }
        
        # API keys (should be loaded from environment)
        self.api_keys = {
            "alpha_vantage": "YOUR_ALPHA_VANTAGE_KEY",
            "newsapi": "YOUR_NEWS_API_KEY",
            "fred": "YOUR_FRED_KEY"
        }
    
    async def collect_comprehensive_data(self, 
                                      symbols: List[str],
                                      start_date: datetime,
                                      end_date: datetime,
                                      timeframe: str = "1d") -> pd.DataFrame:
        """Collect comprehensive training data."""
        
        logger.info(f"Collecting data for {len(symbols)} symbols from {start_date} to {end_date}")
        
        # Collect market data
        market_data = await self._collect_market_data(symbols, start_date, end_date, timeframe)
        
        # Collect alternative data
        alternative_data = await self._collect_alternative_data(symbols, start_date, end_date)
        
        # Collect economic data
        economic_data = await self._collect_economic_data(start_date, end_date)
        
        # Combine all data sources
        combined_data = self._combine_data_sources(market_data, alternative_data, economic_data)
        
        # Add technical indicators
        combined_data = self._add_technical_indicators(combined_data)
        
        # Add market regime labels
        combined_data = self._add_regime_labels(combined_data)
        
        # Add cross-asset features
        combined_data = self._add_cross_asset_features(combined_data)
        
        logger.info(f"Collected {len(combined_data)} data points with {len(combined_data.columns)} features")
        
        return combined_data
    
    async def _collect_market_data(self, 
                                 symbols: List[str],
                                 start_date: datetime,
                                 end_date: datetime,
                                 timeframe: str) -> pd.DataFrame:
        """Collect market data from multiple sources."""
        
        all_data = []
        
        for symbol in symbols:
            try:
                # Determine data source based on symbol
                if symbol.endswith('USD') and len(symbol) > 6:  # Crypto
                    data = await self._collect_crypto_data(symbol, start_date, end_date, timeframe)
                else:  # Equity/ETF
                    data = await self._collect_equity_data(symbol, start_date, end_date, timeframe)
                
                if data is not None and not data.empty:
                    data['symbol'] = symbol
                    all_data.append(data)
                    
            except Exception as e:
                logger.error(f"Error collecting data for {symbol}: {e}")
                continue
        
        if all_data:
            return pd.concat(all_data, ignore_index=True)
        else:
            return pd.DataFrame()
    
    async def _collect_equity_data(self, 
                                 symbol: str,
                                 start_date: datetime,
                                 end_date: datetime,
                                 timeframe: str) -> pd.DataFrame:
        """Collect equity data using yfinance."""
        
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(
                start=start_date,
                end=end_date,
                interval=timeframe,
                auto_adjust=True,
                back_adjust=True
            )
            
            if data.empty:
                return None
                
            # Reset index to get date as column
            data = data.reset_index()
            data['timestamp'] = data['Date']
            data = data.drop('Date', axis=1)
            
            # Add basic features
            data['returns'] = data['Close'].pct_change()
            data['log_returns'] = np.log(data['Close'] / data['Close'].shift(1))
            data['volatility'] = data['returns'].rolling(window=20).std()
            
            return data
            
        except Exception as e:
            logger.error(f"Error collecting equity data for {symbol}: {e}")
            return None
    
    async def _collect_crypto_data(self, 
                                 symbol: str,
                                 start_date: datetime,
                                 end_date: datetime,
                                 timeframe: str) -> pd.DataFrame:
        """Collect crypto data using CCXT."""
        
        try:
            # Convert timeframe
            timeframe_map = {
                "1m": "1m", "5m": "5m", "15m": "15m",
                "1h": "1h", "4h": "4h", "1d": "1d"
            }
            ccxt_timeframe = timeframe_map.get(timeframe, "1d")
            
            # Use Binance for crypto data
            exchange = self.exchanges["binance"]
            
            # Convert dates to milliseconds
            start_ms = int(start_date.timestamp() * 1000)
            end_ms = int(end_date.timestamp() * 1000)
            
            # Fetch OHLCV data
            ohlcv = exchange.fetch_ohlcv(symbol, ccxt_timeframe, start_ms, limit=1000)
            
            if not ohlcv:
                return None
            
            # Convert to DataFrame
            data = pd.DataFrame(ohlcv, columns=['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume'])
            data['timestamp'] = pd.to_datetime(data['timestamp'], unit='ms')
            
            # Add basic features
            data['returns'] = data['Close'].pct_change()
            data['log_returns'] = np.log(data['Close'] / data['Close'].shift(1))
            data['volatility'] = data['returns'].rolling(window=20).std()
            
            return data
            
        except Exception as e:
            logger.error(f"Error collecting crypto data for {symbol}: {e}")
            return None
    
    async def _collect_alternative_data(self, 
                                      symbols: List[str],
                                      start_date: datetime,
                                      end_date: datetime) -> pd.DataFrame:
        """Collect alternative data (news sentiment, etc.)."""
        
        # This is a placeholder - in production, you would integrate with:
        # - News API for sentiment analysis
        # - Social media APIs for sentiment
        # - Economic data APIs
        # - Options flow data
        
        logger.info("Collecting alternative data...")
        
        # Create mock alternative data for now
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        alt_data = []
        
        for date in dates:
            for symbol in symbols:
                alt_data.append({
                    'timestamp': date,
                    'symbol': symbol,
                    'news_sentiment': np.random.normal(0, 0.1),  # Mock sentiment
                    'social_sentiment': np.random.normal(0, 0.15),  # Mock social sentiment
                    'fear_greed_index': np.random.uniform(0, 100),  # Mock fear/greed
                    'vix': np.random.uniform(10, 40),  # Mock VIX
                    'dxy': np.random.uniform(90, 110),  # Mock Dollar Index
                })
        
        return pd.DataFrame(alt_data)
    
    async def _collect_economic_data(self, 
                                   start_date: datetime,
                                   end_date: datetime) -> pd.DataFrame:
        """Collect economic data."""
        
        # This is a placeholder - in production, you would integrate with:
        # - FRED API for economic indicators
        # - Central bank APIs
        # - Economic calendar APIs
        
        logger.info("Collecting economic data...")
        
        # Create mock economic data
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        econ_data = []
        
        for date in dates:
            econ_data.append({
                'timestamp': date,
                'interest_rate': np.random.uniform(0.5, 5.0),  # Mock interest rate
                'inflation_rate': np.random.uniform(1.0, 4.0),  # Mock inflation
                'gdp_growth': np.random.uniform(-2.0, 4.0),  # Mock GDP growth
                'unemployment_rate': np.random.uniform(3.0, 8.0),  # Mock unemployment
                'consumer_confidence': np.random.uniform(80, 120),  # Mock confidence
            })
        
        return pd.DataFrame(econ_data)
    
    def _combine_data_sources(self, 
                            market_data: pd.DataFrame,
                            alternative_data: pd.DataFrame,
                            economic_data: pd.DataFrame) -> pd.DataFrame:
        """Combine all data sources."""
        
        if market_data.empty:
            return pd.DataFrame()
        
        # Start with market data
        combined = market_data.copy()
        
        # Merge alternative data
        if not alternative_data.empty:
            combined = combined.merge(
                alternative_data, 
                on=['timestamp', 'symbol'], 
                how='left'
            )
        
        # Merge economic data
        if not economic_data.empty:
            combined = combined.merge(
                economic_data, 
                on='timestamp', 
                how='left'
            )
        
        # Forward fill missing values
        combined = combined.fillna(method='ffill').fillna(method='bfill')
        
        return combined
    
    def _add_technical_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """Add comprehensive technical indicators."""
        
        if data.empty:
            return data
        
        df = data.copy()
        
        # Moving averages
        df['sma_5'] = df['Close'].rolling(window=5).mean()
        df['sma_10'] = df['Close'].rolling(window=10).mean()
        df['sma_20'] = df['Close'].rolling(window=20).mean()
        df['sma_50'] = df['Close'].rolling(window=50).mean()
        df['sma_200'] = df['Close'].rolling(window=200).mean()
        
        # Exponential moving averages
        df['ema_12'] = df['Close'].ewm(span=12).mean()
        df['ema_26'] = df['Close'].ewm(span=26).mean()
        df['ema_50'] = df['Close'].ewm(span=50).mean()
        
        # MACD
        df['macd'] = df['ema_12'] - df['ema_26']
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']
        
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        df['bb_middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['bb_upper'] = df['bb_middle'] + (bb_std * 2)
        df['bb_lower'] = df['bb_middle'] - (bb_std * 2)
        df['bb_width'] = df['bb_upper'] - df['bb_lower']
        df['bb_position'] = (df['Close'] - df['bb_lower']) / df['bb_width']
        
        # ATR (Average True Range)
        high_low = df['High'] - df['Low']
        high_close = np.abs(df['High'] - df['Close'].shift())
        low_close = np.abs(df['Low'] - df['Close'].shift())
        true_range = np.maximum(high_low, np.maximum(high_close, low_close))
        df['atr'] = true_range.rolling(window=14).mean()
        
        # Stochastic Oscillator
        low_14 = df['Low'].rolling(window=14).min()
        high_14 = df['High'].rolling(window=14).max()
        df['stoch_k'] = 100 * (df['Close'] - low_14) / (high_14 - low_14)
        df['stoch_d'] = df['stoch_k'].rolling(window=3).mean()
        
        # Williams %R
        df['williams_r'] = -100 * (high_14 - df['Close']) / (high_14 - low_14)
        
        # CCI (Commodity Channel Index)
        typical_price = (df['High'] + df['Low'] + df['Close']) / 3
        sma_tp = typical_price.rolling(window=20).mean()
        mad = typical_price.rolling(window=20).apply(lambda x: np.mean(np.abs(x - x.mean())))
        df['cci'] = (typical_price - sma_tp) / (0.015 * mad)
        
        # Volume indicators
        df['volume_sma'] = df['Volume'].rolling(window=20).mean()
        df['volume_ratio'] = df['Volume'] / df['volume_sma']
        df['obv'] = (df['Volume'] * np.sign(df['Close'].diff())).cumsum()
        
        # Price patterns
        df['higher_high'] = (df['High'] > df['High'].shift(1)).astype(int)
        df['lower_low'] = (df['Low'] < df['Low'].shift(1)).astype(int)
        df['inside_bar'] = ((df['High'] < df['High'].shift(1)) & 
                           (df['Low'] > df['Low'].shift(1))).astype(int)
        
        # Volatility indicators
        df['volatility_20'] = df['returns'].rolling(window=20).std()
        df['volatility_5'] = df['returns'].rolling(window=5).std()
        df['volatility_ratio'] = df['volatility_5'] / df['volatility_20']
        
        return df
    
    def _add_regime_labels(self, data: pd.DataFrame) -> pd.DataFrame:
        """Add market regime labels."""
        
        if data.empty:
            return data
        
        df = data.copy()
        
        # Calculate regime indicators
        df['trend_regime'] = 'sideways'
        df.loc[df['sma_20'] > df['sma_50'], 'trend_regime'] = 'uptrend'
        df.loc[df['sma_20'] < df['sma_50'], 'trend_regime'] = 'downtrend'
        
        # Volatility regime
        df['vol_regime'] = 'normal'
        df.loc[df['volatility_20'] > df['volatility_20'].quantile(0.8), 'vol_regime'] = 'high'
        df.loc[df['volatility_20'] < df['volatility_20'].quantile(0.2), 'vol_regime'] = 'low'
        
        # Market regime (combination)
        df['market_regime'] = df['trend_regime'] + '_' + df['vol_regime']
        
        return df
    
    def _add_cross_asset_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Add cross-asset correlation features."""
        
        if data.empty:
            return data
        
        df = data.copy()
        
        # Calculate correlations with market indices
        if 'symbol' in df.columns:
            # Group by symbol and calculate rolling correlations
            for symbol in df['symbol'].unique():
                symbol_data = df[df['symbol'] == symbol].copy()
                
                # Rolling correlation with market (if multiple symbols)
                if len(df['symbol'].unique()) > 1:
                    market_returns = df.groupby('timestamp')['returns'].mean()
                    symbol_data['market_correlation'] = symbol_data['returns'].rolling(
                        window=20
                    ).corr(symbol_data['timestamp'].map(market_returns))
                
                # Update the main dataframe
                df.loc[df['symbol'] == symbol, 'market_correlation'] = symbol_data['market_correlation']
        
        return df

async def main():
    """Main function to collect training data."""
    
    # Initialize data collector
    collector = EnhancedDataCollector()
    
    # Define symbols to collect
    symbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',  # Tech stocks
        'BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD',   # Crypto
        'EURUSD', 'GBPUSD', 'USDJPY',             # Forex
        'SPY', 'QQQ', 'IWM', 'GLD', 'TLT'         # ETFs
    ]
    
    # Define date range (5 years of data)
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=5*365)
    
    # Collect comprehensive data
    training_data = await collector.collect_comprehensive_data(
        symbols=symbols,
        start_date=start_date,
        end_date=end_date,
        timeframe='1d'
    )
    
    # Save data
    output_path = Path('training_data_comprehensive.csv')
    training_data.to_csv(output_path, index=False)
    
    logger.info(f"Training data saved to {output_path}")
    logger.info(f"Data shape: {training_data.shape}")
    logger.info(f"Columns: {list(training_data.columns)}")
    
    # Print summary statistics
    print("\n=== Training Data Summary ===")
    print(f"Total records: {len(training_data)}")
    print(f"Total features: {len(training_data.columns)}")
    print(f"Date range: {training_data['timestamp'].min()} to {training_data['timestamp'].max()}")
    print(f"Symbols: {training_data['symbol'].unique()}")
    
    # Print feature categories
    feature_categories = {
        'Price Data': ['Open', 'High', 'Low', 'Close', 'Volume'],
        'Technical Indicators': [col for col in training_data.columns if any(indicator in col.lower() for indicator in ['sma', 'ema', 'rsi', 'macd', 'bb', 'atr', 'stoch', 'williams', 'cci'])],
        'Alternative Data': [col for col in training_data.columns if any(alt in col.lower() for alt in ['sentiment', 'vix', 'dxy', 'fear', 'greed'])],
        'Economic Data': [col for col in training_data.columns if any(econ in col.lower() for econ in ['interest', 'inflation', 'gdp', 'unemployment', 'confidence'])],
        'Regime Labels': [col for col in training_data.columns if 'regime' in col.lower()],
        'Cross-Asset': [col for col in training_data.columns if 'correlation' in col.lower()]
    }
    
    for category, features in feature_categories.items():
        if features:
            print(f"\n{category}: {len(features)} features")
            print(f"  {features[:5]}{'...' if len(features) > 5 else ''}")

if __name__ == "__main__":
    asyncio.run(main())
