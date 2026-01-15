import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.agent import Agent
from app.models.user.user import User

async def main():
    async with AsyncSessionLocal() as db:
        # List all agents
        res = await db.execute(select(Agent))
        agents = res.scalars().all()
        print(f"Total Agents in DB: {len(agents)}")
        for a in agents:
            print(f"Agent ID: {a.id}, Agent UUID: {a.agent_id}, User ID: {a.user_id}, Status: {a.status}")

        # Check target user
        email = "hariharabudra@gmail.com"
        res_u = await db.execute(select(User).where(User.email == email))
        user = res_u.scalars().first()
        if user:
            print(f"Target User ID: {user.id}")
        else:
            print("Target user not found.")

if __name__ == "__main__":
    asyncio.run(main())
