import imaplib2
import email
import re
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class IMAPEmailReader:
    """Reads verification codes from email via IMAP."""
    
    def __init__(self, host, user, password):
        self.host = host
        self.user = user
        self.password = password

    async def get_latest_code(self, sender_keyword: str, timeout: int = 120) -> Optional[str]:
        """Polls for the latest 6-digit verification code from a specific sender."""
        start_time = time.time()
        logger.info(f"Starting IMAP poll for {sender_keyword} verification code...")
        
        while time.time() - start_time < timeout:
            try:
                mail = imaplib2.IMAP4_SSL(self.host)
                mail.login(self.user, self.password)
                mail.select("inbox")
                
                # Search for unread emails from the keyword
                # Simplified search: subject or from
                status, data = mail.search(None, f'(UNSEEN OR ALL) BODY "{sender_keyword}"')
                
                if status == 'OK':
                    mail_ids = data[0].split()
                    if mail_ids:
                        # Get the latest email ID
                        latest_id = mail_ids[-1]
                        status, data = mail.fetch(latest_id, '(RFC822)')
                        
                        if status == 'OK':
                            raw_email = data[0][1]
                            msg = email.message_from_bytes(raw_email)
                            
                            # Extract body
                            body = ""
                            if msg.is_multipart():
                                for part in msg.walk():
                                    if part.get_content_type() == "text/plain":
                                        body = part.get_payload(decode=True).decode()
                                        break
                            else:
                                body = msg.get_payload(decode=True).decode()
                            
                            # Search for 6-digit code
                            match = re.search(r'\b\d{6}\b', body)
                            if match:
                                code = match.group(0)
                                logger.info(f"Found code via IMAP: {code}")
                                return code
                
                mail.logout()
            except Exception as e:
                logger.error(f"IMAP error: {e}")
            
            time.sleep(10) # Poll interval
            
        logger.warning(f"Timeout reached while waiting for {sender_keyword} code via IMAP.")
        return None
