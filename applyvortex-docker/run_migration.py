import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")

def migrate():
    if not DATABASE_URL:
        print("DATABASE_URL not found.")
        return

    print("Connecting to DB...")
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as conn:
        print("Running cleanup migration...")

        # Drop is_easy_apply column
        try:
            conn.execute(text("ALTER TABLE jobs DROP COLUMN IF EXISTS is_easy_apply;"))
            print("Dropped is_easy_apply.")
        except Exception as e:
            print(f"Error dropping is_easy_apply: {e}")

        # Drop unused indices or other cleanup if needed
        
        print("Cleanup complete.")

if __name__ == "__main__":
    migrate()
