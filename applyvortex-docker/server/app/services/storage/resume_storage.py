import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        # Sanitize Endpoint URL: Remove bucket name if mistakenly included
        endpoint = settings.R2_ENDPOINT_URL.rstrip('/')
        if endpoint.endswith(f"/{settings.R2_BUCKET_NAME}"):
            endpoint = endpoint.replace(f"/{settings.R2_BUCKET_NAME}", "")
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=endpoint,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto'  # R2 requires this placeholder
        )
        self.bucket = settings.R2_BUCKET_NAME

    def create_presigned_upload(self, file_name: str, file_type: str = "application/pdf", expires_in: int = 600):
        """
        Generate a URL for the frontend to upload a file directly.
        Valid for 10 minutes by default.
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket,
                    'Key': file_name,
                    'ContentType': file_type
                },
                ExpiresIn=expires_in
            )
            logger.info(f"Generated presigned upload URL for: {file_name}")
            return url
        except ClientError as e:
            logger.error(f"Error generating upload URL for {file_name}: {e}")
            raise

    def create_presigned_view(self, file_key: str, expires_in: int = 3600):
        """
        Generate a URL to view a private file.
        Valid for 1 hour by default.
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': file_key},
                ExpiresIn=expires_in
            )
            logger.info(f"Generated presigned view URL for: {file_key}")
            return url
        except ClientError as e:
            logger.error(f"Error generating view URL for {file_key}: {e}")
            raise

    def upload_file(self, file_content: bytes, file_key: str, content_type: str = "application/pdf"):
        """
        Upload file content directly to R2.
        Returns the file key on success.
        """
        try:
            self.s3_client.put_object(
                Bucket=self.bucket,
                Key=file_key,
                Body=file_content,
                ContentType=content_type
            )
            logger.info(f"Uploaded file to R2: {file_key}")
            return file_key
        except ClientError as e:
            logger.error(f"Error uploading file {file_key}: {e}")
            raise

    def delete_file(self, file_key: str):
        """
        Delete a file from R2.
        Returns True on success.
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket,
                Key=file_key
            )
            logger.info(f"Deleted file from R2: {file_key}")
            return True
        except ClientError as e:
            logger.error(f"Error deleting file {file_key}: {e}")
            raise

    def file_exists(self, file_key: str) -> bool:
        """
        Check if a file exists in R2.
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=file_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logger.error(f"Error checking file existence {file_key}: {e}")
            raise

    def download_file(self, file_key: str) -> bytes:
        """
        Download file content from R2.
        Returns file content as bytes.
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=file_key)
            content = response['Body'].read()
            logger.info(f"Downloaded file from R2: {file_key}")
            return content
        except ClientError as e:
            logger.error(f"Error downloading file {file_key}: {e}")
            raise

storage_service = StorageService()

