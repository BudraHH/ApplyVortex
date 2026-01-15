from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from app.models.skill.skill import Skill
from app.repositories.base import BaseRepository
from app.constants.constants import SkillsCategory


class SkillRepository(BaseRepository[Skill]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Skill)
    
    async def search_fuzzy(self, query: str, limit: int = 20, verified_only: bool = False) -> List[Skill]:
        base_query = select(Skill)
        
        if query:
            base_query = base_query.where(
                or_(
                    func.lower(Skill.name).contains(func.lower(query)),
                    Skill.aliases.contains([query])
                )
            )
            
        base_query = base_query.order_by(Skill.name)
        
        if verified_only:
            base_query = base_query.where(Skill.is_verified == True)
        
        base_query = base_query.limit(limit)
        result = await self.session.execute(base_query)
        return result.scalars().all()
    
    async def get_or_create_skill(self, name: str) -> Skill:
        # 1. Try exact match
        skill = await self.get_by(name=name.strip())
        if skill:
            return skill
        
        # 2. Try fuzzy match
        fuzzy_matches = await self.search_fuzzy(name, limit=1)
        if fuzzy_matches:
            return fuzzy_matches[0]
        
        # 3. Create new unverified skill
        new_skill = Skill(
            name=name.strip(),
            category=SkillsCategory.OTHER.value,
            is_verified=False
        )
        self.session.add(new_skill)
        await self.session.commit()
        await self.session.refresh(new_skill)
        return new_skill
    
    async def bulk_get_or_create_skills(self, skill_names: List[str]) -> dict[str, Skill]:
        if not skill_names:
            return {}

        # 1. Deduplicate and clean (case-insensitive handling map)
        # Map lower_case -> original_case (prefer first occurrence)
        cleaned_skills = {}
        for name in skill_names:
            if name and name.strip():
                clean_name = name.strip()
                lower_name = clean_name.lower()
                if lower_name not in cleaned_skills:
                    cleaned_skills[lower_name] = clean_name
        
        unique_names = list(cleaned_skills.values())
        if not unique_names:
            return {}

        # 2. Insert with ON CONFLICT DO NOTHING to handle race conditions and duplicates
        from sqlalchemy.dialects.postgresql import insert
        
        # Prepare values for bulk insert
        values = [
            {"name": name, "category": SkillsCategory.OTHER.value, "is_verified": False}
            for name in unique_names
        ]
        
        stmt = insert(Skill).values(values)
        stmt = stmt.on_conflict_do_nothing(
            index_elements=['name'] # Assuming 'name' has unique constraint, or use constraint name if possible
            # Note: If the unique index is on LOWER(name), on_conflict_do_nothing might require specific handling
            # SQLAlchemy might not infer the lower index trigger automatically for 'index_elements'.
            # It is safer to select checking lower() first, then insert carefully?
            # Or use 'constraint' argument if model defines it.
        )
        
        # However, checking the error: "duplicate key value violates unique constraint idx_skills_name_lower"
        # This is a functional index. `index_elements` supports it if we match the definition?
        # Alternatively, we can rely on standard "select existing, insert missing, ignore errors" logic but "ignore errors" breaks transaction.
        # "ON CONFLICT" is the only safe way. But ON CONFLICT with functional index is tricky in SQLAlchemy.
        
        # Let's try the simple "Safe Upsert" pattern:
        # 1. Allow DB to handle conflicts. 
        # But we need output.
        
        # Actually, simpler approach for stability:
        # 1. Fetch ALL existing skills matching input (case-insensitive).
        # 2. Filter out existing.
        # 3. Insert remaining one-by-one with savepoint? Too slow.
        # 4. Insert remaining in bulk with ON CONFLICT.
        
        # Let's try to query first properly using LOWER.
        
        # Step 1: Fetch existing skills by lower name
        lower_names = list(cleaned_skills.keys())
        query = select(Skill).where(func.lower(Skill.name).in_(lower_names))
        result = await self.session.execute(query)
        existing_skills_list = result.scalars().all()
        
        existing_map = {s.name.lower(): s for s in existing_skills_list}
        
        # Step 2: Identify missing
        missing_names = [cleaned_skills[ln] for ln in lower_names if ln not in existing_map]
        
        if missing_names:
            # Insert missing. 
            # Use ON CONFLICT DO NOTHING to be safe against race conditions during this gap.
            # We must use raw SQL or constructing Statement properly because implicit LOWER index.
            
            # Since 'name' column itself might not be unique (only lower(name) is), 
            # using `index_elements=['name']` might NOT work if the constraint depends on LOWER.
            # But usually we enforce uniqueness on the column value too? 
            # If `idx_skills_name_lower` is the ONLY unique constraint, we have to match it.
            
            # Fallback: Just insert one by one? No, slow.
            # Try specific INSERT ... ON CONFLICT (...) DO NOTHING
            
            ts_values = [{"name": name, "category": SkillsCategory.OTHER.value, "is_verified": False} for name in missing_names]
            
            # To handle functional index conflict, we often need the constraint name
            # Constraint: "idx_skills_name_lower" (from error message)
            
            # constraint="idx_skills_name_lower" <- FAILED because it's an index, not a constraint
            
            # Use index_elements with the functional expression matching the index
            # Index is: CREATE UNIQUE INDEX idx_skills_name_lower ON skills (lower(name))
            
            upsert_stmt = insert(Skill).values(ts_values)
            
            # Note: SQLAlchemy's on_conflict_do_nothing index_elements accepts Column objects or strings.
            # Passing a functional expression requires carefully constructing it or just relying on
            # "INSERT ... SELECT ... WHERE NOT EXISTS" which is universally safe but slightly slower.
            # But ON CONFLICT (expression) is supported in PG.
            
            # safest approach with SQLAlchemy asyncpg:
            upsert_stmt = upsert_stmt.on_conflict_do_nothing(
                index_elements=[func.lower(Skill.name)]
            )
            
            await self.session.execute(upsert_stmt)
            await self.session.flush() # Ensure sent
            
        # Step 3: Re-fetch all to get IDs of newly inserted (and handle ones inserted by others)
        # Just re-run the query
        query = select(Skill).where(func.lower(Skill.name).in_(lower_names))
        result = await self.session.execute(query)
        all_skills = result.scalars().all()
        
        final_map = {s.name: s for s in all_skills}
        return final_map
    
    async def get_popular_skills(self, limit: int = 20, category: Optional[str] = None) -> List[Skill]:
        query = select(Skill).where(Skill.is_verified == True).order_by(Skill.name).limit(limit)
        if category:
            try:
                # 1. Try if it's a direct digit string "1"
                cat_id = int(category)
                query = query.where(Skill.category == cat_id)
            except ValueError:
                # 2. Try lookup by Enum name "COMPUTER_DOMAIN"
                try:
                    cat_id = SkillsCategory[category.upper()].value
                    query = query.where(Skill.category == cat_id)
                except (KeyError, AttributeError):
                    pass # Or handle error. For now, skip filter if invalid.
        result = await self.session.execute(query)
        return result.scalars().all()
