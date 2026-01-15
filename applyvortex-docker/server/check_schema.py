#!/usr/bin/env python3
"""Check database schema for removed columns"""

import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def check_schema():
    async with async_session_maker() as session:
        # Check user_projects table
        print("\n" + "="*60)
        print("USER_PROJECTS TABLE SCHEMA")
        print("="*60)
        result = await session.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user_projects' 
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"{row[0]:30} {row[1]:30} {'NULL' if row[2] == 'YES' else 'NOT NULL'}")
        
        # Check user_experiences table
        print("\n" + "="*60)
        print("USER_EXPERIENCES TABLE SCHEMA")
        print("="*60)
        result = await session.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user_experiences' 
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"{row[0]:30} {row[1]:30} {'NULL' if row[2] == 'YES' else 'NOT NULL'}")
        
        # Check user_education table
        print("\n" + "="*60)
        print("USER_EDUCATION TABLE SCHEMA")
        print("="*60)
        result = await session.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user_education' 
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"{row[0]:30} {row[1]:30} {'NULL' if row[2] == 'YES' else 'NOT NULL'}")
        
        # Check for removed columns
        print("\n" + "="*60)
        print("CHECKING FOR REMOVED COLUMNS")
        print("="*60)
        
        removed_columns = {
            'user_projects': ['key_features', 'challenges_faced'],
            'user_experiences': ['key_responsibilities'],
            'user_education': ['honors_awards', 'activities', 'societies', 'achievements']
        }
        
        for table, removed_cols in removed_columns.items():
            for removed_col in removed_cols:
                result = await session.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}' AND column_name = '{removed_col}'
                """))
                if result.first():
                    print(f"❌ WARNING: {table}.{removed_col} still exists!")
                else:
                    print(f"✅ {table}.{removed_col} successfully removed")
        
        print("\n" + "="*60)

if __name__ == "__main__":
    asyncio.run(check_schema())
