import requests
import json

BASE_URL = "http://localhost:8000"

def create_test_data():
    print("Generating test data...")
    
    # 1. Create Interviewer
    interviewer_email = "admin@example.com"
    interviewer_password = "password123"
    interviewer_name = "Test Admin"
    
    try:
        # Try login first to see if exists
        login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": interviewer_email,
            "password": interviewer_password
        })
        
        if login_res.status_code == 200:
            print(f"User already exists. Logged in as {interviewer_email}")
            token = login_res.json()["token"]
        else:
            # Signup
            signup_res = requests.post(f"{BASE_URL}/auth/signup", json={
                "email": interviewer_email,
                "password": interviewer_password,
                "name": interviewer_name
            })
            if signup_res.status_code == 200:
                print(f"Created user: {interviewer_email}")
                token = signup_res.json()["token"]
            else:
                print(f"Failed to create user: {signup_res.text}")
                return

        # 2. Create Session
        headers = {"Authorization": f"Bearer {token}"}
        session_res = requests.post(f"{BASE_URL}/sessions", json={
            "candidateName": "Candidate John",
            "candidateEmail": "candidate@example.com",
            "language": "python"
        }, headers=headers)
        
        if session_res.status_code == 201:
            session = session_res.json()
            print("\n--- Test Data ---")
            print(f"Interviewer Email: {interviewer_email}")
            print(f"Interviewer Password: {interviewer_password}")
            print(f"Session ID: {session['id']}")
            print(f"Candidate Join Link: http://localhost:8080/room/{session['id']}?role=candidate")
            print("-----------------")
        else:
            print(f"Failed to create session: {session_res.text}")

    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Make sure it is running on port 8000.")

if __name__ == "__main__":
    create_test_data()
