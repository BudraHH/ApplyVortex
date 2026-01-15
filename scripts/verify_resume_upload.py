import requests
import time
import sys
import os

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "budrahh@gmail.com" # Making an assumption here, will prompt or override if needed
PASSWORD = "password123"    # Default dev password usually

def run_test():
    session = requests.Session()

    # 1. Login / Register
    email = "test_resume_user@example.com"
    password = "password123"
    
    print(f"Attempting to login as {email}...")
    login_resp = session.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    
    if login_resp.status_code != 200:
        print("Login failed, attempting registration...")
        reg_payload = {
            "email": email,
            "password": password,
            "name": "Test User"
        }
        reg_resp = session.post(f"{BASE_URL}/auth/register", json=reg_payload)
        if reg_resp.status_code == 200:
            print("Registration successful.")
            # Login again just to be sure session is set properly (though register sets cookies too)
            login_resp = session.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        else:
             print(f"Registration failed: {reg_resp.text}")
             return

    if login_resp.status_code != 200:
         print(f"Final Login Failed: {login_resp.text}")
         return
         
    print("Login successful.")
    print("Cookies:", session.cookies.get_dict())
    
    # Manually add Bearer token to headers to avoid cookie issues
    token = session.cookies.get("access_token")
    if token:
        session.headers.update({"Authorization": f"Bearer {token}"})

    # 2. Get Upload URL
    file_name = "dummy_resume.txt"
    print(f"Requesting upload URL for {file_name}...")
    upload_req_payload = {"file_name": file_name, "file_type": "text/plain"}
    upload_url_resp = session.post(f"{BASE_URL}/resumes/upload-url", json=upload_req_payload)
    if upload_url_resp.status_code != 200:
        print(f"Failed to get upload URL: {upload_url_resp.text}")
        return
    
    upload_data = upload_url_resp.json()
    upload_url = upload_data["upload_url"]
    file_key = upload_data["file_key"]
    print(f"Got upload URL. File Key: {file_key}")

    # 3. Upload File to R2 (Simulated)
    # Since we are local, and maybe R2 is mocked or real, we try to PUT to the URL.
    # If using localstack/minio, the URL might be localhost.
    
    dummy_content = """
    John Doe
    Software Engineer
    Email: john.doe@example.com
    Phone: +1-555-010-9999
    
    Experience:
    Senior Developer at Tech Corp (2020 - Present)
    - Built amazing things with Python and React.
    
    Education:
    B.Sc Computer Science, University of Technology
    
    Skills:
    Python, JavaScript, Docker, AWS
    """
    
    print("Uploading content to storage...")
    r2_resp = requests.put(upload_url, data=dummy_content, headers={"Content-Type": "text/plain"})
    
    # Note: If running inside docker, localhost might refer to container, but here we are on host.
    # If the presigned URL uses a docker service name (e.g. http://minio:9000...), it might fail from host.
    # We'll see.
    if r2_resp.status_code not in [200, 201]:
         print(f"Warning: R2 upload returned {r2_resp.status_code}. This might be expected if using a mock.")
         # Continue anyway as the backend might just check existence
    else:
        print("Upload to storage successful.")

    # 4. Create Resume Record (Triggers Parsing)
    print("Creating resume record...")
    create_payload = {
        "file_key": file_key,
        "file_name": file_name,
        "file_size": len(dummy_content),
        "file_format": "txt",
        "is_default": False
    }
    create_resp = session.post(f"{BASE_URL}/resumes", json=create_payload)
    if create_resp.status_code != 201:
        print(f"Failed to create resume: {create_resp.text}")
        return
    
    resume_data = create_resp.json()
    resume_id = resume_data["id"]
    print(f"Resume created with ID: {resume_id}")
    print("Parsing triggered in background...")

    # 5. Poll Status
    print("Polling for status...")
    for _ in range(30): # Wait up to 60s
        status_resp = session.get(f"{BASE_URL}/resumes/{resume_id}")
        if status_resp.status_code != 200:
            print(f"Error checking status: {status_resp.text}")
            break
            
        r_data = status_resp.json()
        status_text = r_data.get("parsing_status")
        print(f"Status: {status_text}")
        
        if status_text == "completed":
            print("✅ Parsing COMPLETED!")
            print("Parsed Data Sample:", str(r_data.get("parsed_data"))[:200])
            break
        elif status_text == "failed":
            print("❌ Parsing FAILED!")
            print("Error:", r_data.get("parsing_error"))
            break
            
        time.sleep(2)

if __name__ == "__main__":
    run_test()
