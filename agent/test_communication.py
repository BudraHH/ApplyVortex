import asyncio
import logging
import sys
import os

# Ensure we can import from agent package
sys.path.append(os.path.dirname(os.getcwd()))

from agent.core.identity import AgentIdentity
from agent.core.heartbeat import HeartbeatLoop
from agent.client import APIClient
from config import settings

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TestComm")

async def test_identity():
    print("\n--- Testing Agent Identity ---")
    identity = AgentIdentity(os.getcwd())
    print(f"Agent ID: {identity.get_id()}")
    print(f"System Info: {identity.get_system_info()}")
    
    # Verify persistence
    if os.path.exists("agent_identity.json"):
        print("✅ agent_identity.json exists.")
    else:
        print("❌ agent_identity.json Missing!")

async def test_heartbeat():
    print("\n--- Testing Heartbeat Loop (5s duration) ---")
    
    # 1. Setup Client
    client = APIClient()
    # Ensure legitimate Login if possible, or Mock
    if not client.login():
        print("❌ Login failed. Ensure API_KEY is set in .env")
        return

    # Register Agent (Essential for Heartbeat)
    print("Registering Agent...")
    if client.register_agent():
        print("✅ Agent Registered.")
    else:
        print("❌ Agent Registration Failed.")
        return

    # 2. Define Callback
    async def on_command(cmd):
        print(f"⚡ RECEIVED COMMAND: {cmd}")

    # 3. Start Loop (short interval for testing)
    hb = HeartbeatLoop(client, interval_seconds=2, on_command=on_command)
    
    # Run in background
    task = asyncio.create_task(hb.start())
    
    # Let it run for 5 seconds
    await asyncio.sleep(5)
    
    # Stop
    hb.stop()
    await asyncio.sleep(1) # Allow cleanup
    task.cancel()
    print("✅ Heartbeat test finished.")

async def main():
    await test_identity()
    await test_heartbeat()
    print("\n--- Tests Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
