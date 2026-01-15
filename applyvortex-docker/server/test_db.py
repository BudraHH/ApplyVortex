
import asyncio
import asyncpg
import ssl
import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback if env var is missing or empty
    DATABASE_URL = "postgresql://neondb_owner:npg_pIXv9NKHU3CO@ep-muddy-rain-a47uehdw-pooler.us-east-1.aws.neon.tech/applyvortex_db"

if "postgresql+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")

print(f"Testing connection to: {DATABASE_URL}")

async def run():
    print("--- Test 1: Plaintext (ssl='disable') ---")
    try:
        conn = await asyncpg.connect(DATABASE_URL + "?sslmode=disable", timeout=5)
        print("Connected via Plaintext!")
        await conn.close()
    except Exception as e:
        print(f"Plaintext failed: {e}")

    print("\n--- Test 2: Standard SSL (sslmode=require) ---")
    try:
        conn = await asyncpg.connect(DATABASE_URL + "?sslmode=require", timeout=10)
        print("Connected via Standard SSL!")
        await conn.close()
    except Exception as e:
        print(f"Standard SSL failed: {e}")

    print("\n--- Test 3: Custom SSL Context ---")
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        # Remove params for raw connection
        clean_url = DATABASE_URL
        conn = await asyncpg.connect(clean_url, ssl=ctx, timeout=10)
        print("Connected via Custom SSL Context!")
        await conn.close()
    except Exception as e:
        print(f"Custom SSL failed: {e}")

if __name__ == "__main__":
    asyncio.run(run())
