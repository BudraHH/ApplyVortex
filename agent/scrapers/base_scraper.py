from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseScraper(ABC):
    @abstractmethod
    async def scrape(self, keywords: List[str], location: List[str] | str, date_posted: str = None, check_cancelled: Any = None, on_progress: Any = None) -> List[Dict[str, Any]]:
        pass
