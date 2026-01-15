
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
        # Correct Key Hash using app utils
        import sys
        import os
        sys.path.append(os.getcwd()) # Ensure app import works
        
        # We need to import the exact hashing function used by the app
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        auth_secret = "apf_agent_1cAYJdLeUSvzlMpxLRXa9u_ks1Z5s-OB" # FULL KEY
        correct_hash = pwd_context.hash(auth_secret)
        
        user_id = "5fb65ad7-5401-4063-a350-08aea494d485"
        
        print(f"Updating key hash for user {user_id}...")
        cur.execute("""
            UPDATE agent_api_keys 
            SET key_hash = %s, updated_at = NOW()
            WHERE user_id = %s
        """, (correct_hash, user_id))
        conn.commit()
        print("Key hash updated successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_error()
