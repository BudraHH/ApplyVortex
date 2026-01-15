"""Human Behavior Simulation Engine - rtrvr.ai Grade Anti-Detection

Implements realistic human-like interactions:
- Bezier curve mouse movement with micro-jitter
- Natural typing with errors and corrections
- Organic scroll patterns with overscroll
- Random pauses and "thinking time"
"""

import asyncio
import random
import math
from typing import Tuple, Optional
from playwright.async_api import Page, ElementHandle
import logging

logger = logging.getLogger(__name__)


class HumanSimulator:
    """Simulates human-like browser interactions to evade bot detection."""
    
    # Timing constants (in seconds)
    HOVER_TIME_MIN = 0.08
    HOVER_TIME_MAX = 0.25
    TYPING_DELAY_MIN = 0.05
    TYPING_DELAY_MAX = 0.15
    TYPO_RATE = 0.02  # 2% chance of typo
    PAUSE_EVERY_N_CHARS = 5
    
    @staticmethod
    def _bezier_curve(start: Tuple[float, float], 
                      end: Tuple[float, float], 
                      steps: int = 20) -> list:
        """Generate bezier curve points with natural control points.
        
        Args:
            start: (x, y) starting position
            end: (x, y) ending position
            steps: Number of interpolation steps
            
        Returns:
            List of (x, y) coordinates along the curve
        """
        start_x, start_y = start
        end_x, end_y = end
        
        # Generate natural control points for curved movement
        distance = math.sqrt((end_x - start_x)**2 + (end_y - start_y)**2)
        
        # Control point 1: offset from start
        ctrl1_x = start_x + random.uniform(0.2, 0.4) * (end_x - start_x) + random.uniform(-50, 50)
        ctrl1_y = start_y + random.uniform(-0.2, 0.2) * distance + random.uniform(-50, 50)
        
        # Control point 2: offset from end
        ctrl2_x = end_x - random.uniform(0.2, 0.4) * (end_x - start_x) + random.uniform(-30, 30)
        ctrl2_y = end_y + random.uniform(-0.2, 0.2) * distance + random.uniform(-30, 30)
        
        points = []
        for i in range(steps + 1):
            t = i / steps
            
            # Cubic Bezier formula
            x = (1-t)**3 * start_x + \
                3 * (1-t)**2 * t * ctrl1_x + \
                3 * (1-t) * t**2 * ctrl2_x + \
                t**3 * end_x
            
            y = (1-t)**3 * start_y + \
                3 * (1-t)**2 * t * ctrl1_y + \
                3 * (1-t) * t**2 * ctrl2_y + \
                t**3 * end_y
            
            # Add micro-jitter (hand tremor simulation)
            jitter_x = random.uniform(-2, 2)
            jitter_y = random.uniform(-2, 2)
            
            points.append((x + jitter_x, y + jitter_y))
        
        return points
    
    @staticmethod
    async def human_click(page: Page, 
                         selector: str, 
                         hover_time: Optional[Tuple[float, float]] = None,
                         timeout: int = 10000) -> bool:
        """Perform human-like click with bezier curve movement and hover.
        
        Args:
            page: Playwright page object
            selector: CSS selector for element to click
            hover_time: (min, max) hover duration in seconds
            timeout: Element wait timeout in ms
            
        Returns:
            True if click succeeded, False otherwise
        """
        try:
            # Wait for element
            element = await page.wait_for_selector(selector, timeout=timeout)
            if not element:
                logger.warning(f"Element not found: {selector}")
                return False
            
            # Get element bounding box
            box = await element.bounding_box()
            if not box:
                logger.warning(f"Element has no bounding box: {selector}")
                return False
            
            # Calculate target position (center with random offset)
            target_x = box['x'] + box['width'] / 2 + random.uniform(-8, 8)
            target_y = box['y'] + box['height'] / 2 + random.uniform(-8, 8)
            
            # Get current mouse position (or use viewport center as fallback)
            try:
                current_pos = await page.evaluate("() => ({ x: window.mouseX || 960, y: window.mouseY || 540 })")
                start_x = current_pos.get('x', 960)
                start_y = current_pos.get('y', 540)
            except:
                start_x, start_y = 960, 540  # Fallback to center
            
            # Generate bezier curve path
            path = HumanSimulator._bezier_curve((start_x, start_y), (target_x, target_y), steps=20)
            
            # Move mouse along curve with variable speed
            for i, (x, y) in enumerate(path):
                await page.mouse.move(x, y)
                
                # Variable delay (slower at start/end, faster in middle)
                t = i / len(path)
                # Ease-in-out timing
                delay = 0.01 + 0.02 * (1 - abs(2*t - 1))
                await asyncio.sleep(delay)
                
                # Update tracked position
                await page.evaluate(f"window.mouseX = {x}; window.mouseY = {y};")
            
            # Hover pause before click (human hesitation)
            if hover_time is None:
                hover_time = (HumanSimulator.HOVER_TIME_MIN, HumanSimulator.HOVER_TIME_MAX)
            await asyncio.sleep(random.uniform(*hover_time))
            
            # Perform click
            await page.mouse.click(target_x, target_y)
            
            # Brief pause after click
            await asyncio.sleep(random.uniform(0.05, 0.15))
            
            logger.debug(f"Human click completed: {selector}")
            return True
            
        except Exception as e:
            logger.error(f"Human click failed for {selector}: {e}")
            return False
    
    @staticmethod
    async def human_type(page: Page, 
                        selector: str, 
                        text: str,
                        clear_first: bool = True) -> bool:
        """Type text with human-like delays, errors, and corrections.
        
        Args:
            page: Playwright page object
            selector: CSS selector for input element
            text: Text to type
            clear_first: Clear existing text before typing
            
        Returns:
            True if typing succeeded, False otherwise
        """
        try:
            element = await page.wait_for_selector(selector, timeout=10000)
            if not element:
                return False
            
            # Click to focus
            await HumanSimulator.human_click(page, selector, hover_time=(0.05, 0.1))
            
            # Clear existing text if requested
            if clear_first:
                await element.click(click_count=3)  # Triple-click to select all
                await asyncio.sleep(random.uniform(0.05, 0.1))
                await page.keyboard.press('Backspace')
                await asyncio.sleep(random.uniform(0.1, 0.2))
            
            # Type with natural rhythm
            for i, char in enumerate(text):
                # Simulate typos (2% chance)
                if random.random() < HumanSimulator.TYPO_RATE and i > 0:
                    # Type wrong character
                    wrong_char = random.choice('abcdefghijklmnopqrstuvwxyz')
                    await page.keyboard.type(wrong_char, delay=random.uniform(80, 120))
                    await asyncio.sleep(random.uniform(0.1, 0.3))
                    
                    # Realize mistake and backspace
                    await page.keyboard.press('Backspace')
                    await asyncio.sleep(random.uniform(0.15, 0.25))
                
                # Type correct character
                delay = random.uniform(
                    HumanSimulator.TYPING_DELAY_MIN * 1000,
                    HumanSimulator.TYPING_DELAY_MAX * 1000
                )
                await page.keyboard.type(char, delay=delay)
                
                # Natural pause every N characters (thinking/reading)
                if (i + 1) % HumanSimulator.PAUSE_EVERY_N_CHARS == 0:
                    await asyncio.sleep(random.uniform(0.05, 0.15))
            
            # Brief pause after typing
            await asyncio.sleep(random.uniform(0.1, 0.3))
            
            logger.debug(f"Human typing completed: {selector}")
            return True
            
        except Exception as e:
            logger.error(f"Human typing failed for {selector}: {e}")
            return False
    
    @staticmethod
    async def human_scroll(page: Page, 
                          direction: str = 'down',
                          distance: Optional[int] = None,
                          chunks: int = 5) -> bool:
        """Scroll with human-like chunked movement and jitter.
        
        Args:
            page: Playwright page object
            direction: 'down' or 'up'
            distance: Total distance to scroll (None = full page)
            chunks: Number of scroll chunks
            
        Returns:
            True if scroll succeeded
        """
        try:
            # Get page height if distance not specified
            if distance is None:
                if direction == 'down':
                    distance = await page.evaluate("""
                        () => document.body.scrollHeight - window.innerHeight
                    """)
                else:
                    distance = await page.evaluate("() => window.scrollY")
            
            if distance <= 0:
                return True
            
            # Calculate chunk size with randomness
            base_chunk = distance / chunks
            
            for i in range(chunks):
                # Variable chunk size (natural scrolling)
                chunk_size = base_chunk * random.uniform(0.7, 1.3)
                
                # Add jitter to scroll amount
                jitter = random.uniform(-50, 50)
                scroll_amount = chunk_size + jitter
                
                # Scroll
                if direction == 'down':
                    await page.evaluate(f"window.scrollBy(0, {scroll_amount})")
                else:
                    await page.evaluate(f"window.scrollBy(0, -{scroll_amount})")
                
                # Variable pause between scrolls (reading time)
                pause = random.uniform(0.4, 1.2)
                await asyncio.sleep(pause)
                
                # Occasional overscroll correction (human behavior)
                if random.random() < 0.15:  # 15% chance
                    correction = random.uniform(20, 60)
                    if direction == 'down':
                        await page.evaluate(f"window.scrollBy(0, -{correction})")
                    else:
                        await page.evaluate(f"window.scrollBy(0, {correction})")
                    await asyncio.sleep(random.uniform(0.2, 0.4))
            
            logger.debug(f"Human scroll completed: {direction}, {distance}px")
            return True
            
        except Exception as e:
            logger.error(f"Human scroll failed: {e}")
            return False
    
    @staticmethod
    async def random_pause(min_sec: float = 0.5, max_sec: float = 2.0):
        """Random thinking/reading pause.
        
        Args:
            min_sec: Minimum pause duration
            max_sec: Maximum pause duration
        """
        await asyncio.sleep(random.uniform(min_sec, max_sec))
    
    @staticmethod
    async def micro_pause():
        """Very brief pause (100-300ms) for natural rhythm."""
        await asyncio.sleep(random.uniform(0.1, 0.3))
