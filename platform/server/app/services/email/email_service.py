# app/services/email/email_service.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.EMAIL_FROM,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_SERVER,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True if settings.ENVIRONMENT == "production" else False
        )
        self.mailer = FastMail(self.conf)

    async def send_verification_email(self, email: str, token: str):
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify your email"
        body = (
            f"""
            <html>
                <body>
                    <h2>Welcome to {settings.PROJECT_NAME}!</h2>
                    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
                    <p><a href='{verification_url}'>Verify Email</a></p>
                    <p>If you did not sign up, you can ignore this email.</p>
                </body>
            </html>
            """
        )
        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=body,
            subtype="html"
        )
        try:
            await self.mailer.send_message(message)
        except Exception as e:
            # Log error or handle as needed
            import logging
            logging.getLogger("email").error(f"Failed to send verification email: {e}")
            raise

    async def send_email(self, subject: str, recipients: list, body: str, subtype: str = "html"):
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=subtype
        )
        try:
            await self.mailer.send_message(message)
        except Exception as e:
            import logging
            logging.getLogger("email").error(f"Failed to send email: {e}")
            raise