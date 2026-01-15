"""Central logging configuration for the ApplyVortex backend."""

from __future__ import annotations

import logging
from logging.config import dictConfig
from typing import Any, Dict


def _build_logging_config() -> Dict[str, Any]:
    """Return the logging configuration used throughout the project."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
            }
        },
        "loggers": {
            "applyvortex": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            }
        },
        "root": {
            "handlers": ["console"],
            "level": "WARNING",
        },
    }


dictConfig(_build_logging_config())
logger = logging.getLogger("applyvortex")

