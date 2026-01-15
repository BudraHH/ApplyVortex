import asyncio
import logging
import websockets
import json
from typing import Callable

logger = logging.getLogger(__name__)

class WebSocketClient:
    def __init__(self, server_url: str, agent_id: str, api_key: str, on_message: Callable):
        self.server_url = server_url.replace("http", "ws") # naïve replacement
        self.url = f"{self.server_url}/ws/agent/{agent_id}"
        self.api_key = api_key
        self.on_message = on_message
        self.running = False
        self.reconnect_delay = 5

    async def start(self):
        """Connect and listen loop."""
        self.running = True
        logger.info(f"Connecting to WebSocket: {self.url}")
        
        while self.running:
            try:
                extra_headers = {"X-API-Key": self.api_key}
                async with websockets.connect(self.url, extra_headers=extra_headers) as websocket:
                    logger.info("WebSocket Connected!")
                    self.reconnect_delay = 5 # Reset backoff
                    
                    while self.running:
                        message = await websocket.recv()
                        logger.debug(f"WS Received: {message}")
                        
                        try:
                            # Handle "WAKE_UP" or JSON
                            if message == "WAKE_UP":
                                await self.on_message("WAKE_UP")
                            else:
                                data = json.loads(message)
                                await self.on_message(data)
                        except Exception as e:
                            logger.error(f"Error handling WS message: {e}")

            except (websockets.ConnectionClosed, ConnectionRefusedError) as e:
                logger.warning(f"WebSocket disconnected ({e}). Retrying in {self.reconnect_delay}s...")
                await asyncio.sleep(self.reconnect_delay)
                self.reconnect_delay = min(self.reconnect_delay * 2, 60) # Exponential backoff
            except Exception as e:
                logger.error(f"WebSocket Critical Error: {e}")
                await asyncio.sleep(5)
    
    def stop(self):
        self.running = False
