"""Trading calendar and market hours management."""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from enum import Enum
import pytz
from dataclasses import dataclass
from trading.config import AssetClass
from trading.logging_utils import TradingLogger

data_logger = TradingLogger("trading.data")


class MarketStatus(str, Enum):
    """Market status."""
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    PRE_MARKET = "PRE_MARKET"
    AFTER_HOURS = "AFTER_HOURS"


@dataclass
class TradingSession:
    """Trading session definition."""
    name: str
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    timezone: str
    days: List[int]  # 0=Monday, 6=Sunday


class TradingCalendar:
    """Trading calendar for different asset classes."""

    def __init__(self):
        self.sessions = {
            AssetClass.EQUITY: [
                TradingSession(
                    name="Regular Hours",
                    start_time="09:30",
                    end_time="16:00",
                    timezone="US/Eastern",
                    days=[0, 1, 2, 3, 4]  # Monday to Friday
                ),
                TradingSession(
                    name="Pre-Market",
                    start_time="04:00",
                    end_time="09:30",
                    timezone="US/Eastern",
                    days=[0, 1, 2, 3, 4]
                ),
                TradingSession(
                    name="After Hours",
                    start_time="16:00",
                    end_time="20:00",
                    timezone="US/Eastern",
                    days=[0, 1, 2, 3, 4]
                )
            ],
            AssetClass.CRYPTO: [
                TradingSession(
                    name="24/7",
                    start_time="00:00",
                    end_time="23:59",
                    timezone="UTC",
                    days=[0, 1, 2, 3, 4, 5, 6]  # All days
                )
            ],
            AssetClass.FX: [
                TradingSession(
                    name="24/7",
                    start_time="00:00",
                    end_time="23:59",
                    timezone="UTC",
                    days=[0, 1, 2, 3, 4, 5, 6]  # All days
                )
            ],
            AssetClass.COMMODITY: [
                TradingSession(
                    name="Regular Hours",
                    start_time="09:00",
                    end_time="17:00",
                    timezone="US/Eastern",
                    days=[0, 1, 2, 3, 4]
                )
            ],
            AssetClass.BOND: [
                TradingSession(
                    name="Regular Hours",
                    start_time="08:00",
                    end_time="17:00",
                    timezone="US/Eastern",
                    days=[0, 1, 2, 3, 4]
                )
            ]
        }

    def is_market_open(
        self,
        asset_class: AssetClass,
        timestamp: datetime = None
    ) -> Tuple[bool, MarketStatus]:
        """Check if market is open for given asset class."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        sessions = self.sessions.get(asset_class, [])

        for session in sessions:
            if self._is_in_session(session, timestamp):
                if session.name == "Regular Hours":
                    return True, MarketStatus.OPEN
                elif session.name == "Pre-Market":
                    return True, MarketStatus.PRE_MARKET
                elif session.name == "After Hours":
                    return True, MarketStatus.AFTER_HOURS
                else:
                    return True, MarketStatus.OPEN

        return False, MarketStatus.CLOSED

    def get_next_market_open(
        self,
        asset_class: AssetClass,
        timestamp: datetime = None
    ) -> Optional[datetime]:
        """Get next market open time."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        sessions = self.sessions.get(asset_class, [])

        # Look ahead up to 7 days
        for days_ahead in range(8):
            check_time = timestamp + timedelta(days=days_ahead)

            for session in sessions:
                if self._is_in_session(session, check_time):
                    return self._get_session_start(session, check_time)

        return None

    def get_next_market_close(
        self,
        asset_class: AssetClass,
        timestamp: datetime = None
    ) -> Optional[datetime]:
        """Get next market close time."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        sessions = self.sessions.get(asset_class, [])

        # Check current day first
        for session in sessions:
            if self._is_in_session(session, timestamp):
                return self._get_session_end(session, timestamp)

        # Look ahead
        for days_ahead in range(1, 8):
            check_time = timestamp + timedelta(days=days_ahead)

            for session in sessions:
                if self._is_in_session(session, check_time):
                    return self._get_session_end(session, check_time)

        return None

    def get_trading_hours_today(
        self,
        asset_class: AssetClass,
        timestamp: datetime = None
    ) -> List[Tuple[datetime, datetime]]:
        """Get trading hours for today."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        sessions = self.sessions.get(asset_class, [])
        trading_hours = []

        for session in sessions:
            if self._is_session_day(session, timestamp):
                start_time = self._get_session_start(session, timestamp)
                end_time = self._get_session_end(session, timestamp)
                trading_hours.append((start_time, end_time))

        return trading_hours

    def get_market_status_info(
        self,
        asset_class: AssetClass,
        timestamp: datetime = None
    ) -> Dict[str, Any]:
        """Get comprehensive market status information."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        is_open, status = self.is_market_open(asset_class, timestamp)
        next_open = self.get_next_market_open(asset_class, timestamp)
        next_close = self.get_next_market_close(asset_class, timestamp)
        trading_hours = self.get_trading_hours_today(asset_class, timestamp)

        return {
            "is_open": is_open,
            "status": status.value,
            "timestamp": timestamp.isoformat(),
            "asset_class": asset_class.value,
            "next_open": next_open.isoformat() if next_open else None,
            "next_close": next_close.isoformat() if next_close else None,
            "trading_hours_today": [
                {
                    "start": start.isoformat(),
                    "end": end.isoformat()
                }
                for start, end in trading_hours
            ]
        }

    def _is_in_session(
            self,
            session: TradingSession,
            timestamp: datetime) -> bool:
        """Check if timestamp is within trading session."""
        if not self._is_session_day(session, timestamp):
            return False

        # Convert timestamp to session timezone
        session_tz = pytz.timezone(session.timezone)
        local_time = timestamp.astimezone(session_tz)

        # Parse session times
        start_hour, start_min = map(int, session.start_time.split(':'))
        end_hour, end_min = map(int, session.end_time.split(':'))

        start_time = local_time.replace(
            hour=start_hour,
            minute=start_min,
            second=0,
            microsecond=0)
        end_time = local_time.replace(
            hour=end_hour,
            minute=end_min,
            second=0,
            microsecond=0)

        # Handle overnight sessions
        if end_time <= start_time:
            end_time += timedelta(days=1)

        return start_time <= local_time <= end_time

    def _is_session_day(
            self,
            session: TradingSession,
            timestamp: datetime) -> bool:
        """Check if timestamp is on a session day."""
        weekday = timestamp.weekday()  # 0=Monday, 6=Sunday
        return weekday in session.days

    def _get_session_start(
            self,
            session: TradingSession,
            timestamp: datetime) -> datetime:
        """Get session start time for given date."""
        session_tz = pytz.timezone(session.timezone)
        local_time = timestamp.astimezone(session_tz)

        start_hour, start_min = map(int, session.start_time.split(':'))
        start_time = local_time.replace(
            hour=start_hour,
            minute=start_min,
            second=0,
            microsecond=0)

        return start_time.astimezone(timezone.utc)

    def _get_session_end(
            self,
            session: TradingSession,
            timestamp: datetime) -> datetime:
        """Get session end time for given date."""
        session_tz = pytz.timezone(session.timezone)
        local_time = timestamp.astimezone(session_tz)

        end_hour, end_min = map(int, session.end_time.split(':'))
        end_time = local_time.replace(
            hour=end_hour,
            minute=end_min,
            second=0,
            microsecond=0)

        # Handle overnight sessions
        if end_time <= local_time.replace(
                hour=0, minute=0, second=0, microsecond=0):
            end_time += timedelta(days=1)

        return end_time.astimezone(timezone.utc)


class MarketHoursFilter:
    """Filter data based on market hours."""

    def __init__(self, calendar: TradingCalendar = None):
        self.calendar = calendar or TradingCalendar()

    def filter_by_market_hours(
        self,
        data: pd.DataFrame,
        asset_class: AssetClass,
        include_pre_market: bool = False,
        include_after_hours: bool = False
    ) -> pd.DataFrame:
        """Filter DataFrame to include only market hours."""
        if data.empty:
            return data

        filtered_data = []

        for timestamp, row in data.iterrows():
            is_open, status = self.calendar.is_market_open(
                asset_class, timestamp)

            if is_open:
                if status == MarketStatus.OPEN:
                    filtered_data.append(row)
                elif status == MarketStatus.PRE_MARKET and include_pre_market:
                    filtered_data.append(row)
                elif status == MarketStatus.AFTER_HOURS and include_after_hours:
                    filtered_data.append(row)

        if filtered_data:
            return pd.DataFrame(
                filtered_data, index=[
                    row.name for row in filtered_data])
        else:
            return pd.DataFrame()

    def get_market_hours_mask(
        self,
        timestamps: pd.DatetimeIndex,
        asset_class: AssetClass
    ) -> pd.Series:
        """Get boolean mask for market hours."""
        mask = pd.Series(False, index=timestamps)

        for i, timestamp in enumerate(timestamps):
            is_open, _ = self.calendar.is_market_open(asset_class, timestamp)
            mask.iloc[i] = is_open

        return mask


# Global calendar instance
trading_calendar = TradingCalendar()
market_hours_filter = MarketHoursFilter(trading_calendar)
