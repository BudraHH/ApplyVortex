# app/models/mixins.py

from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Boolean, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, declared_attr


class UUIDMixin:
    @declared_attr
    def id(cls) -> Mapped[UUID]:
        return mapped_column(
            PG_UUID(as_uuid=True),
            primary_key=True,
            default=uuid4,
            nullable=False,
            index=True
        )


class TimestampMixin:
    @declared_attr
    def created_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            default=lambda: datetime.now(timezone.utc),
            nullable=False
        )

    @declared_attr
    def updated_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            default=lambda: datetime.now(timezone.utc),
            onupdate=lambda: datetime.now(timezone.utc),
            nullable=False
        )


class SoftDeleteMixin:
    @declared_attr
    def deleted_at(cls) -> Mapped[Optional[datetime]]:
        return mapped_column(
            DateTime(timezone=True),
            nullable=True,
            default=None
        )

    @declared_attr
    def deletion_reason(cls) -> Mapped[Optional[str]]:
        return mapped_column(Text, nullable=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self, reason: Optional[str] = None) -> None:
        self.deleted_at = datetime.now(timezone.utc)
        if reason:
            self.deletion_reason = reason

    def restore(self) -> None:
        self.deleted_at = None
        self.deletion_reason = None


class UserOwnedMixin:
    @declared_attr
    def user_id(cls) -> Mapped[UUID]:
        return mapped_column(
            PG_UUID(as_uuid=True),
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )


class SerializableMixin:
    def to_dict(
        self,
        include: Optional[List[str]] = None,
        exclude: Optional[List[str]] = None,
    ) -> dict:
        result = {}
        for column in self.__table__.columns:
            if include and column.name not in include:
                continue
            if exclude and column.name in exclude:
                continue

            value = getattr(self, column.name)

            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            elif isinstance(value, UUID):
                result[column.name] = str(value)
            elif hasattr(value, "__iter__") and not isinstance(value, (str, bytes)):
                result[column.name] = list(value) if value else None
            else:
                result[column.name] = value
        return result

    def to_dict_safe(self) -> dict:
        sensitive_fields = [
            "password_hash",
            "password_reset_token",
            "email_verification_token",
            "oauth_access_token",
            "oauth_refresh_token",
            "two_factor_secret",
            "two_factor_backup_codes",
        ]
        return self.to_dict(exclude=sensitive_fields)


class DisplayOrderMixin:
    @declared_attr
    def display_order(cls) -> Mapped[int]:
        return mapped_column(Integer, default=0, nullable=False)


class FeaturedMixin:
    @declared_attr
    def is_featured(cls) -> Mapped[bool]:
        return mapped_column(Boolean, default=False, nullable=False)


class ActiveMixin:
    @declared_attr
    def is_active(cls) -> Mapped[bool]:
        return mapped_column(Boolean, default=True, nullable=False)


class VerifiedMixin:
    @declared_attr
    def is_verified(cls) -> Mapped[bool]:
        return mapped_column(Boolean, default=False, nullable=False)


class MetadataMixin:
    @declared_attr
    def metadata_(cls) -> Mapped[Optional[dict]]:
        return mapped_column("metadata", JSONB, nullable=True)


class PopularityMixin:
    @declared_attr
    def popularity_score(cls) -> Mapped[int]:
        return mapped_column(Integer, default=0, nullable=False)

    @declared_attr
    def view_count(cls) -> Mapped[int]:
        return mapped_column(Integer, default=0, nullable=False)

    @declared_attr
    def use_count(cls) -> Mapped[int]:
        return mapped_column(Integer, default=0, nullable=False)

    def increment_popularity(self, amount: int = 1) -> None:
        self.popularity_score += amount

    def increment_views(self, amount: int = 1) -> None:
        self.view_count += amount

    def increment_uses(self, amount: int = 1) -> None:
        self.use_count += amount


__all__ = [
    "UUIDMixin",
    "TimestampMixin",
    "SoftDeleteMixin",
    "UserOwnedMixin",
    "SerializableMixin",
    "DisplayOrderMixin",
    "FeaturedMixin",
    "ActiveMixin",
    "VerifiedMixin",
    "MetadataMixin",
    "PopularityMixin",
]