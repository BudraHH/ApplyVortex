from typing import List, Optional, Any
from app.utils.name_utils import split_full_name
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user.user_repository import UserRepository
from app.schemas.user.user import UserResponse, UserUpdate, UserListQuery
from app.core.exceptions import UserNotFound
from app.core.hashing import get_password_hash
from datetime import datetime

from app.services.profile import ProfileService


class UserService:
    def __init__(
        self, 
        db: AsyncSession = None, 
        user_repo: Optional[UserRepository] = None,
        profile_service: Optional[ProfileService] = None
    ):
        self.db = db
        self.user_repo = user_repo or UserRepository(db)
        self.profile_service = profile_service
    
    async def get_user(self, user_id: UUID) -> UserResponse:
        """Get user with profile completeness"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFound()
        return await self.get_user_response(user)

    async def get_user_response(self, user: Any) -> UserResponse:
        """Construct UserResponse from User object efficiently"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Calculate profile completeness using existing profile if loaded
            completeness = 0
            try:
                completeness = await self.profile_service.calculate_completeness(user.id, profile_obj=user.profile)
            except Exception as e:
                logger.error(f"Error calculating completeness for user {user.id}: {e}")

            # Construct full name
            name = "Unknown"
            if user.profile:
                parts = [user.profile.first_name, user.profile.middle_name, user.profile.last_name]
                name = " ".join([p for p in parts if p]).strip() or "Unknown"
            
            # SAFEGUARD: Ensure name meets min_length=2 requirement
            if len(name) < 2:
                name = "User"

            # Handle Enum Conversion safely
            from app.constants.constants import AccountStatus, UserRole
            
            account_status_str = "active" # Default
            try:
                if isinstance(user.account_status, int):
                    account_status_str = AccountStatus(user.account_status).name.lower()
                elif hasattr(user.account_status, 'value'):
                    account_status_str = AccountStatus(user.account_status.value).name.lower()
                else:
                    account_status_str = str(user.account_status).lower()
            except Exception as e:
                logger.warning(f"Failed to convert account_status enum: {e}")
                print(f"DEBUG: account_status fail: {user.account_status} type {type(user.account_status)}")

            role_str = "user" # Default
            try:
                if isinstance(user.role, int):
                    role_str = UserRole(user.role).name.lower()
                elif hasattr(user.role, 'value'):
                    role_str = UserRole(user.role.value).name.lower()
                else:
                    role_str = str(user.role).lower()
            except Exception as e:
                logger.warning(f"Failed to convert role enum: {e}")
                print(f"DEBUG: role fail: {user.role} type {type(user.role)}")

            return UserResponse(
                id=user.id,
                email=user.email,
                name=name,
                email_verified=user.email_verified,
                account_status=account_status_str,
                profile_completeness=completeness,
                is_active=user.is_active,
                role=role_str,
                created_at=user.created_at,
                updated_at=user.updated_at,
                two_factor_enabled=user.two_factor_enabled,
                last_login_ip=str(user.last_login_ip) if user.last_login_ip else None,
                admin_notes=user.admin_notes,
                deleted_at=user.deleted_at,
                
                # Profile Extensions
                first_name=user.profile.first_name if user.profile else None,
                middle_name=user.profile.middle_name if user.profile else None,
                last_name=user.profile.last_name if user.profile else None,
                phone=user.profile.phone_number if user.profile else None,
                phone_country_code=user.profile.phone_country_code if user.profile else None,
                timezone=user.profile.timezone if user.profile else None,
                date_format=user.profile.date_format if user.profile else None
            )
        except Exception as e:
            logger.error(f"CRITICAL Error in get_user_response: {e}", exc_info=True)
            print(f"CRITICAL PRINT in get_user_response: {e}")
            raise e
    
    async def update_user(self, user_id: UUID, update_data: UserUpdate) -> UserResponse:
        """Update user details (email, password, preferences)"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFound()
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Hash password if provided
        password_changed = False
        if 'password' in update_dict:
            update_dict['password_hash'] = get_password_hash(update_dict.pop('password'))
            password_changed = True
        
        # Update fields
        for field, value in update_dict.items():
            setattr(user, field, value)
            
        # Security Notification if password changed
        if password_changed:
            try:
                from app.repositories.user.notification_repository import NotificationRepository
                from app.constants.constants import NotificationType
                
                # Flush first to ensure user updates are pending
                await self.db.flush()
                
                notification_repo = NotificationRepository(self.db)
                await notification_repo.create_notification(
                    user_id=user.id,
                    type=NotificationType.SECURITY,
                    title="Security Alert",
                    message="Your password was recently changed. If this wasn't you, contact support immediately.",
                    action_url="/settings/account",
                    metadata={"source": "user_settings", "event": "password_change"}
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to send security notification: {e}")
        
        user.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(user)
        
        # Recalculate completeness
        completeness = await self.profile_service.calculate_completeness(user_id)
        
        return await self.get_user_response(user)
    
    async def list_users(self, query: UserListQuery) -> List[UserResponse]:
        """Admin: List users with pagination"""
        # Fetch users with pagination
        users = await self.user_repo.list_users(
            limit=query.limit, 
            offset=query.offset,
            role=query.role,
            is_active=query.is_active,
            search=query.search,
            sort_by=query.sort_by,
            sort_desc=query.sort_desc
        )
        
        responses = []
        for user in users:
            responses.append(await self.get_user_response(user))
        
        return responses
    
    async def soft_delete_user(self, user_id: UUID) -> bool:
        """Soft delete user (set status=deleted)"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFound()
        
        user.account_status = "deleted"
        user.deleted_at = datetime.utcnow()
        await self.db.commit()
        return True
    async def activate_user(self, user_id: UUID) -> UserResponse:
        """Admin: Reactivate deleted/locked user"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFound()
        
        user.account_status = 1 # AccountStatus.ACTIVE.value
        user.locked_until = None
        user.failed_login_attempts = 0
        user.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(user)
        
        return await self.get_user_response(user)

    async def create_user_admin(self, user_data: Any) -> UserResponse:
        """Admin: Create a new user manually"""
        from app.models.user.user import User
        from app.core.exceptions import EmailAlreadyExists
        from app.models.user.profile import UserProfile

        # Check if exists
        existing_user = await self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise EmailAlreadyExists()

        hashed_password = get_password_hash(user_data.password)

        # Create User
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            name=user_data.name,
            role=user_data.role,
            account_status=user_data.account_status,
            email_verified=user_data.email_verified
        )
        self.db.add(new_user)
        await self.db.flush()

        from app.utils.name_utils import split_full_name
        name_parts = split_full_name(user_data.name)

        new_profile = UserProfile(
            user_id=new_user.id,
            first_name=name_parts["first_name"],
            middle_name=name_parts["middle_name"],
            last_name=name_parts["last_name"],
            gender=0, # Default to PREFER_NOT_TO_SAY or similar
            current_city="Not Specified",
            preferred_work_mode=0
        )
        self.db.add(new_profile)
        
        await self.db.commit()
        await self.db.refresh(new_user)
        
        return await self.get_user_response(new_user)

    async def get_account_settings(self, user_id: UUID) -> Any:
        from app.schemas.user.settings import AccountSettingsResponse
        
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFound()
            
        profile = user.profile
        
        return AccountSettingsResponse(
            email=user.email,
            is_active=user.is_active,
            email_verified=user.email_verified,
            
            # Profile fields
            first_name=profile.first_name if profile else "",
            middle_name=profile.middle_name if profile else None,
            last_name=profile.last_name if profile else "",
            phone_number=profile.phone_number if profile else None,
            phone_country_code=profile.phone_country_code if profile else None,
            timezone=profile.timezone if profile else None,
            date_format=profile.date_format if profile else None
        )

    async def update_account_settings(self, user_id: UUID, update_data: Any) -> Any:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFound()

        profile = user.profile
        if not profile:
             # Logic to create if drastically missing, usually handled at signup
             pass 
        
        data = update_data.model_dump(exclude_unset=True)
        
        # Handle Full Name Splitting
        if 'full_name' in data and data['full_name']:
            name_parts = split_full_name(data['full_name'])
            # Update data dict with split parts, overriding if they exist or adding them
            data.update(name_parts)
        
        # Profile fields mapping
        profile_fields = [
            'first_name', 'middle_name', 'last_name', 
            'phone_number', 'phone_country_code',
            'timezone', 'date_format'
        ]
        for field in profile_fields:
            if field in data:
                setattr(profile, field, data[field])
        
        # specific logic for name sync

        
        user.updated_at = datetime.utcnow()
        if profile:
            profile.last_updated_at = datetime.utcnow()

        await self.db.commit()
        
        return await self.get_account_settings(user_id)

    async def update_password(self, user_id: UUID, password_data: dict) -> dict:
        """
        Update user password after verifying current password.
        Triggers security alerts and revokes other sessions for robustness.
        """
        from app.core.hashing import verify_password
        from fastapi import HTTPException, status
        from datetime import datetime, timezone
        
        # 1. Get user
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFound()
        
        # 2. Verify current password
        if not user.password_hash or not verify_password(password_data['current_password'], user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # 3. Hash and update new password
        now = datetime.now(timezone.utc)
        new_password_hash = get_password_hash(password_data['new_password'])
        user.password_hash = new_password_hash
        user.password_changed_at = now
        user.updated_at = now
        
        # 4. Revoke all OTHER sessions (Robustness: kicker out attackers)
        try:
            from app.services.user.session_service import SessionService
            session_service = SessionService(self.db)
            # Fetch current session jti to keep it if possible, or just revoke all.
            # For simplicity, we'll revoke others if session service allows, or just let them re-login.
            # Most secure approach is to revoke ALL and force re-login, but UX-wise revoking others is better.
            await session_service.revoke_all_user_sessions(user_id, reason="Security reset (Password changed)") 
            # Note: The current user will need to log in again on next request unless we preserve their session.
            # In our current setup, revoking all is safer.
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to revoke sessions after password change: {e}")

        # 5. Internal Security Notification
        try:
            from app.repositories.user.notification_repository import NotificationRepository
            from app.constants.constants import NotificationType
            notification_repo = NotificationRepository(self.db)
            await notification_repo.create_notification(
                user_id=user.id,
                type=NotificationType.SECURITY,
                title="Security Alert",
                message="Your password was recently changed. If this wasn't you, contact support immediately.",
                action_url="/settings",
                metadata={"source": "user_settings", "event": "password_change"}
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send security notification: {e}")

        # 6. Background Email Alert (Asynchronous robustness)
        try:
            from app.worker import send_security_alert_email
            send_security_alert_email.delay(
                user.email, 
                user.profile.full_name if user.profile else "User",
                "password_change"
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to trigger email alert worker: {e}")

        await self.db.commit()
        
        return {"message": "Password updated successfully. For security, other sessions have been logged out."}

