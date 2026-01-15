# app/models/base.py

import re
from typing import Any, List, Optional
from sqlalchemy import MetaData
from sqlalchemy.orm import declarative_base, declared_attr

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)

Base = declarative_base(metadata=metadata)

class BaseModel(Base):
    __abstract__ = True

    @declared_attr
    def __tablename__(cls) -> str:
        """
        Auto-generate table name from class name.
        Converts CamelCase to snake_case and pluralizes.
        Ex: UserProfile -> user_profiles
        """
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', cls.__name__)
        name = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
        if not name.endswith('s'):
            name += 's'
        return name

    def __repr__(self) -> str:
        """Generate readable string representation."""
        attrs = []
        for col in self.__table__.columns:
            if col.name in ['id', 'email', 'name', 'title', 'slug', 'name']:
                value = getattr(self, col.name, None)
                attrs.append(f"{col.name}={value}")
        
        return f"{self.__class__.__name__}({', '.join(attrs)})"

    def to_dict(self, exclude: Optional[List[str]] = None) -> dict[str, Any]:
        """Convert model instance to dictionary."""
        exclude = exclude or []
        result = {}

        for col in self.__table__.columns:
            if col.name not in exclude:
                value = getattr(self, col.name)
                if hasattr(value, "isoformat"):
                    result[col.name] = value.isoformat()
                elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, list, dict, type(None))):
                    result[col.name] = str(value)
                else:
                    result[col.name] = value
        return result

    @classmethod
    def get_by_id(cls, session, id: Any):
        """Get instance by ID."""
        return session.query(cls).filter(cls.id == id).first()

    @classmethod
    def get_all(cls, session, limit: int = None, offset: int = None):
        """Get all instances with optional pagination."""
        query = session.query(cls)
        if offset is not None:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)
        return query.all()

    def save(self, session):
        """Save instance to database."""
        session.add(self)
        session.commit()
        session.refresh(self)
        return self

    def delete(self, session):
        """Delete instance from database."""
        session.delete(self)
        session.commit()

__all__ = ["BaseModel", "Base", "metadata", "NAMING_CONVENTION"]