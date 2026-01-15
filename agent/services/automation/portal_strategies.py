"""Portal-specific automation strategies for job applications."""

import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path

from playwright.async_api import Page, TimeoutError as PlaywrightTimeoutError

from app.models.user.user import User
from app.services.automation.browser_service import FormFieldMapper, FileUploadHandler
from app.services.ai.resume_generation_service import resume_generation_service

class PortalStrategy(ABC):
    """Abstract base class for portal-specific automation strategies."""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.file_upload_handler = FileUploadHandler()
    
    @abstractmethod
    async def apply(self, page: Page, user: User, resume_path: str, application_id: str) -> Dict[str, Any]:
        """Execute the application process for this portal."""
        pass
    
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Check if this strategy can handle the given URL."""
        pass
    
    async def take_screenshot(self, page: Page, application_id: str, step: str) -> str:
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{application_id}_{step}_{timestamp}.png"
            screenshots_dir = Path("/app/data/screenshots")
            screenshots_dir.mkdir(parents=True, exist_ok=True)
            screenshot_path = screenshots_dir / filename
            await page.screenshot(path=str(screenshot_path), full_page=True)
            return str(screenshot_path)
        except Exception as e:
            self.logger.error(f"Screenshot failed: {e}")
            return ""

class LinkedInStrategy(PortalStrategy):
    """LinkedIn-specific automation strategy."""
    
    def can_handle(self, url: str) -> bool:
        return "linkedin.com" in url.lower()
    
    async def apply(self, page: Page, user: User, resume_path: str, application_id: str) -> Dict[str, Any]:
        result = {"success": False, "error": None, "screenshots": []}
        try:
            self.logger.info(f"Starting LinkedIn Easy Apply for {application_id}")
            
            # Find and click Easy Apply
            btn = await page.query_selector('button:has-text("Easy Apply")')
            if not btn:
                result["error"] = "Easy Apply button not found"
                return result
            
            await btn.click()
            await page.wait_for_timeout(2000)
            
            # Form filling (simplified for now)
            # Map ApplyVortex UserProfile to LinkedIn fields
            profile = user.profile
            if profile:
                # We use the native playwright fill if we find the selectors
                phone_input = await page.query_selector('input[id*="phone"]')
                if phone_input and profile.phone_number:
                    await phone_input.fill(profile.phone_number)
            
            # Handle resume upload
            if resume_path:
                await self.file_upload_handler.upload_file(page, 'input[type="file"]', resume_path)
            
            # Submit
            submit_btn = await page.query_selector('button:has-text("Submit application")')
            if submit_btn:
                await submit_btn.click()
                await page.wait_for_timeout(3000)
                result["success"] = True
            
            return result
        except Exception as e:
            self.logger.error(f"LinkedIn application failed: {e}")
            result["error"] = str(e)
            return result

class GenericATSStrategy(PortalStrategy):
    """Universal strategy that uses NLP to fill unknown job forms."""
    
    def can_handle(self, url: str) -> bool:
        # Fallback strategy, handled manually by orchestrator
        return False
        
    async def apply(self, page: Page, user: User, resume_path: str, application_id: str) -> Dict[str, Any]:
        result = {"success": False, "error": None, "screenshots": []}
        try:
            self.logger.info(f"Starting Generic AI Apply for {application_id}")
            
            # 1. Analyze form fields
            fields = await FormFieldMapper.get_form_context(page)
            if not fields:
                result["error"] = "No form fields detected"
                return result
                
            # 2. Map fields using Ollama
            user_profile_summary = {
                "first_name": user.profile.first_name if user.profile else "",
                "last_name": user.profile.last_name if user.profile else "",
                "email": user.email,
                "phone": user.profile.phone_number if user.profile else "",
                "website": user.profile.portfolio_url if user.profile else "",
                "linkedin": user.profile.linkedin_url if user.profile else "",
                "location": f"{user.profile.current_city}, {user.profile.current_country}" if user.profile else ""
            }
            
            mapping_result = await resume_generation_service.map_form_fields(
                form_fields=[{k: v for k, v in f.items() if k != "element"} for f in fields],
                user_profile_summary=user_profile_summary
            )
            
            # 3. Fill fields
            mappings = mapping_result.get("mappings", [])
            for mapping in mappings:
                field_key = mapping.get("field")
                # Find matching element in our extracted fields
                target_field = next((f for f in fields if f["id"] == mapping.get("id") or f["name"] == mapping.get("name")), None)
                if not target_field: continue
                
                element = target_field["element"]
                if field_key == "resume_upload":
                    await self.file_upload_handler.upload_file(page, f"#{target_field['id']}" if target_field['id'] else f"input[name='{target_field['name']}']", resume_path)
                elif field_key in user_profile_summary:
                    val = user_profile_summary[field_key]
                    if val:
                        await element.fill(val)
            
            # 4. Attempt submission
            # Generic attempt to find a submit button
            submit_selectors = FormFieldMapper.SELECTORS["submit"]
            for selector in submit_selectors:
                submit_btn = await page.query_selector(selector)
                if submit_btn and await submit_btn.is_visible():
                    await submit_btn.click()
                    await page.wait_for_timeout(3000)
                    result["success"] = True
                    break
                    
            if not result["success"]:
                result["error"] = "Could not find visible submit button"
                
            return result
        except Exception as e:
            self.logger.error(f"Generic application failed: {e}")
            result["error"] = str(e)
            return result

class IndeedStrategy(PortalStrategy):
    """Indeed-specific automation strategy."""
    
    def can_handle(self, url: str) -> bool:
        return "indeed.com" in url.lower()
    
    async def apply(self, page: Page, user: User, resume_path: str, application_id: str) -> Dict[str, Any]:
        # Implementation similar to LinkedIn but with Indeed selectors
        return {"success": False, "error": "Indeed automation strategy is currently using Generic fallback logic"}

class StrategyOrchestrator:
    """Orchestrator for managing and selecting portal strategies."""
    
    def __init__(self):
        self.strategies = [LinkedInStrategy(), IndeedStrategy()]
        self.fallback = GenericATSStrategy()
    
    def get_strategy(self, url: str) -> Optional[PortalStrategy]:
        for strategy in self.strategies:
            if strategy.can_handle(url):
                return strategy
        return self.fallback

# Global orchestrator instance
strategy_orchestrator = StrategyOrchestrator()
