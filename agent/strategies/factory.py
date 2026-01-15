"""Factory for selecting portal strategies."""

import logging
from .base import PortalStrategy
from .linkedin import LinkedInStrategy
from .indeed import IndeedStrategy
from .default import DefaultStrategy

logger = logging.getLogger(__name__)

class StrategyFactory:
    """Factory class to get appropriate strategy for a URL."""
    
    def __init__(self):
        self.strategies = [
            LinkedInStrategy(),
            IndeedStrategy(),
            DefaultStrategy() # Last resort
        ]
        
    def get_strategy(self, url: str) -> PortalStrategy:
        for strategy in self.strategies:
            if strategy.can_handle(url):
                logger.info(f"Selected strategy: {strategy.__class__.__name__}")
                return strategy
        return self.strategies[-1]

_factory = StrategyFactory()

def get_strategy(url: str) -> PortalStrategy:
    return _factory.get_strategy(url)
