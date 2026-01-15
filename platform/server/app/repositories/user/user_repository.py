# app/repositories/user/user_repository.py

from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from datetime import datetime

from app.core.hashing import verify_password
from app.models.user.user import User

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(
            select(User).options(
                joinedload(User.profile)
            ).filter(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).options(
                joinedload(User.profile)
            ).filter(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_verification_token(self, token: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).filter(
                User.email_verification_token == token,
                User.email_verification_token_expires_at > datetime.utcnow()
            )
        )
        return result.scalar_one_or_none()

    async def list_users(
        self, 
        limit: int = 20, 
        offset: int = 0,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,

        subscription_tier: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = 'joined',
        sort_desc: bool = True
    ) -> list[User]:
        """List all users with filters, pagination and sorting"""
        from sqlalchemy import asc, desc
        
        query = select(User).options(
            joinedload(User.profile)
        )
        
        # Filter by Role
        if role:
            query = query.filter(User.role == role)
            
        # Filter by Status
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        # Subscription tier filtering removed (subscription feature removed)
        # if subscription_tier:
        #     ...
            
        # Search (Email prefix)
        if search:
            query = query.filter(User.email.ilike(f"{search}%"))
            
        # Sorting
        sort_column = User.created_at # Default
        if sort_by == 'joined':
            sort_column = User.created_at
        elif sort_by == 'name':
             # Sort by name requires joining profile effectively or just simple fallback
             # Since name is a property joining might be complex here, lets stick to supported columns
             sort_column = User.created_at
        
        order_func = desc if sort_desc else asc
        query = query.order_by(order_func(sort_column))

        query = query.offset(offset).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, user_data: Dict[str, Any]) -> User:
        user = User(**user_data)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update(self, user_id: UUID, update_data: Dict[str, Any]) -> Optional[User]:
        user = await self.get_by_id(user_id)
        if not user:
            return None

        for key, value in update_data.items():
            if value is not None:
                setattr(user, key, value)

        user.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user