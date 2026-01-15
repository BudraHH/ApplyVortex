"""Generic helper utilities used across modules."""

from __future__ import annotations

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(tz=timezone.utc)

"""Date/time formatting helpers."""
from typing import Optional

def format_duration(
    start_month: int, start_year: int,
    end_month: Optional[int], end_year: Optional[int],
    is_current: bool
) -> str:
    """Format duration as 'YYYY-MM - YYYY-MM' or 'YYYY-MM - Present'."""
    start = f"{start_year}-{start_month:02d}"
    if is_current:
        return f"{start} - Present"
    if end_month and end_year:
        return f"{start} - {end_year}-{end_month:02d}"
    return start