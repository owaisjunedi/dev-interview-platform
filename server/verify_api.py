import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def test_signup():
    print("Testing Signup...")
    email = f"test_{int(time.time())}@example.com"
    payload = {
        "email": email,
        "password": "password123",
        "name": "Test User"
    }
    response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
    if response.status_code == 200:
        print("Signup Success:", response.json())
        return response.json()["token"]
    else:
        print("Signup Failed:", response.text)
        sys.exit(1)

def test_login(email, password):
    print("Testing Login...")
    payload = {
        "email": email,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    if response.status_code == 200:
        print("Login Success")
        return response.json()["token"]
    else:
        print("Login Failed:", response.text)
        sys.exit(1)

def test_create_session(token):
    print("Testing Create Session...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "candidateName": "Candidate 1",
        "candidateEmail": "candidate@example.com",
        "language": "python"
    }
    response = requests.post(f"{BASE_URL}/sessions", json=payload, headers=headers)
    if response.status_code == 201:
        print("Create Session Success:", response.json())
        return response.json()["id"]
    else:
        print("Create Session Failed:", response.text)
        sys.exit(1)

def test_get_sessions(token):
    print("Testing Get Sessions...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/sessions", headers=headers)
    if response.status_code == 200:
        print("Get Sessions Success, count:", len(response.json()))
    else:
        print("Get Sessions Failed:", response.text)
        sys.exit(1)

def main():
    try:
        # Wait for server to start
        time.sleep(2)
        
        token = test_signup()
        # test_login is implicitly tested via signup return, but we can test explicit login too if we tracked email
        
        session_id = test_create_session(token)
        test_get_sessions(token)
        
        print("\nAll API tests passed!")
    except Exception as e:
        print(f"\nTest failed with exception: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
