import boto3
from botocore.config import Config
import os
import sys

def test_r2_connection():
    print("Testing R2 Connection...")
    
    endpoint = os.getenv("R2_ENDPOINT_URL")
    access_key = os.getenv("R2_ACCESS_KEY_ID")
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
    bucket = os.getenv("R2_BUCKET_NAME")

    print(f"Endpoint: {endpoint}")
    print(f"Bucket: {bucket}")
    print(f"Access Key: {'*' * len(access_key) if access_key else 'None'}")
    
    if not all([endpoint, access_key, secret_key, bucket]):
        print("ERROR: Missing environment variables!")
        sys.exit(1)

    # Sanitize endpoint
    endpoint = endpoint.rstrip('/')
    if endpoint.endswith(f"/{bucket}"):
        endpoint = endpoint.replace(f"/{bucket}", "")
        
    print(f"Sanitized Endpoint used for client: {endpoint}")

    try:
        s3 = boto3.client(
            's3',
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        
        # Test List Buckets (Might fail if scoped token)
        print("\nAttempting to list buckets...")
        try:
            response = s3.list_buckets()
            print("Success! Buckets found:")
            for b in response.get('Buckets', []):
                print(f"- {b['Name']}")
        except Exception as e:
            print(f"ListBuckets failed (Expected if token is bucket-scoped): {e}")
            
        # Check specific bucket
        print(f"\nChecking access to bucket: {bucket}")
        s3.head_bucket(Bucket=bucket)
        print(f"Success! Bucket '{bucket}' exists and is accessible.")

        # List objects in bucket
        print(f"\nListing objects in bucket: {bucket}")
        objects = s3.list_objects_v2(Bucket=bucket, MaxKeys=5)
        if 'Contents' in objects:
            for obj in objects['Contents']:
                print(f"- {obj['Key']} ({obj['Size']} bytes)")
        else:
            print("Bucket is empty.")

    except Exception as e:
        print(f"\nFAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_r2_connection()
