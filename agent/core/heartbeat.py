import asyncio
import logging
from typing import Callable, Optional

logger = logging.getLogger(__name__)

class HeartbeatLoop:
    def __init__(self, client, interval_seconds: int = 30, on_command: Optional[Callable] = None):
        """
        :param client: APIClient instance
        :param interval_seconds: Polling interval
        :param on_command: Callback function if server sends a command (e.g. "START_JOB")
        """
        self.client = client
        self.interval = interval_seconds
        self.running = False
        self.on_command = on_command

    async def start(self):
        """Start the background polling loop."""
        self.running = True
        logger.info(f"Heartbeat Loop started (Interval: {self.interval}s)")
        
        while self.running:
            try:
                # 1. Send Heartbeat
                response = self.client.send_heartbeat()
                
                # 2. Check for Piggybacked Commands in Response
                if response and isinstance(response, dict):
                    commands = response.get("commands", [])
                    if commands:
                        logger.info(f"Received {len(commands)} commands from server.")
                        for cmd in commands:
                            await self._handle_command(cmd)

            except Exception as e:
                logger.debug(f"Heartbeat failed: {e}")
            
            # Wait for next interval
            await asyncio.sleep(self.interval)

    async def _handle_command(self, command: dict):
        """Dispatch command to callback."""
        if self.on_command:
            try:
                await self.on_command(command)
            except Exception as e:
                logger.error(f"Error executing command {command}: {e}")

    def stop(self):
        self.running = False
        logger.info("Heartbeat Loop stopping...")

    def trigger_now(self):
        """Manual trigger (e.g. from WebSocket)."""
        logger.info("Heartbeat triggered manually.")
        # In a real async loop, we'd need a way to interrupt the sleep. 
        # For simple robust polling, we just wait. 
        # But if we want instant reaction, we should likely just call the sync action.
        # This is a placeholder for refined interaction.
        pass 
