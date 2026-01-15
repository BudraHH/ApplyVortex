from typing import Generic, TypeVar, Optional, List, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, update
from sqlalchemy.orm import DeclarativeBase


ModelType = TypeVar("ModelType", bound=DeclarativeBase)


class BaseRepository(Generic[ModelType]):
    def __init__(self, session: AsyncSession, model: type[ModelType]):
        self.session = session
        self.model = model
    
    async def get(self, id: UUID) -> Optional[ModelType]:
        result = await self.session.get(self.model, id)
        return result
    
    async def get_by(self, **kwargs: Any) -> Optional[ModelType]:
        query = select(self.model).filter_by(**kwargs)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
    
    async def create_all(self, objs: List[ModelType]) -> List[ModelType]:
        self.session.add_all(objs)
        await self.session.commit()
        await self.session.refresh(objs)
        return objs
    
    async def update(self, id: UUID, updates: dict) -> Optional[ModelType]:
        stmt = update(self.model).where(self.model.id == id).values(**updates)
        await self.session.execute(stmt)
        await self.session.commit()
        return await self.get(id)
    
    async def delete(self, id: UUID) -> bool:
        obj = await self.get(id)
        if obj:
            await self.session.delete(obj)
            await self.session.commit()
            return True
        return False
    
    async def delete_all(self, user_id: Optional[UUID] = None, **kwargs: Any) -> int:
        stmt = delete(self.model)
        if user_id:
            stmt = stmt.where(self.model.user_id == user_id)
        stmt = stmt.where(**kwargs)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount
    
    async def list_all(self, limit: int = 100, offset: int = 0, **kwargs: Any) -> List[ModelType]:
        query = select(self.model).filter_by(**kwargs).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def count(self, **kwargs: Any) -> int:
        query = select(func.count()).select_from(self.model).filter_by(**kwargs)
        result = await self.session.execute(query)
        return result.scalar()
