import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Force Sync
if DATABASE_URL and "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as conn:
        print("Adding device_id column...")
        conn.execute(text("ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS device_id UUID;"))
        
        print("Backfilling device_id...")
        conn.execute(text("UPDATE agent_api_keys SET device_id = gen_random_uuid() WHERE device_id IS NULL;"))
        
        print("Setting device_id NOT NULL and UNIQUE...")
        conn.execute(text("ALTER TABLE agent_api_keys ALTER COLUMN device_id SET NOT NULL;"))
        try:
             conn.execute(text("ALTER TABLE agent_api_keys ADD CONSTRAINT uq_agent_keys_device_id UNIQUE (device_id);"))
        except Exception as e:
             print(f"Constraint might exist: {e}")

        print("Adding install_path...")
        conn.execute(text("ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS install_path VARCHAR;"))
        
        print("Altering key_prefix size...")
        conn.execute(text("ALTER TABLE agent_api_keys ALTER COLUMN key_prefix TYPE VARCHAR(255);"))
    
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
