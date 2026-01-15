
import psycopg2
import os

# Hardcoded from docker-compose.yml
# Use standard postgresql:// format for psycopg2
DATABASE_URL = "postgresql://neondb_owner:npg_pIXv9NKHU3CO@ep-muddy-rain-a47uehdw-pooler.us-east-1.aws.neon.tech/applyvortex_db?sslmode=require"

def check_error():
    print("STARTING SYNC QUERY ...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT id, parsing_status, parsing_error FROM user_resumes ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        if row:
            print(f"ID: {row[0]}")
            print(f"Status: {row[1]}")
            print(f"Error: {row[2]}")
        else:
            print("No rows found")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_error()
