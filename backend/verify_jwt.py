import requests
import sys

BASE_URL = "http://127.0.0.1:5000/api/v1"

def test_jwt_flow():
    username = "testuser_jwt"
    password = "testpassword123"
    email = "testjwt@example.com"

    # 1. Register
    print(f"Registering user {username}...")
    resp = requests.post(f"{BASE_URL}/users/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    # 409 is fine if user already exists
    if resp.status_code not in [200, 409]:
        print(f"Registration failed: {resp.text}")
        sys.exit(1)
    print("Registration successful (or user existed).")

    # 2. Login
    print(f"Logging in...")
    resp = requests.post(f"{BASE_URL}/users/login", json={
        "username": username,
        "password": password
    })
    
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        sys.exit(1)
    
    data = resp.json()
    if "token" not in data:
        print("No token in login response!")
        sys.exit(1)
    
    token = data["token"]
    print(f"Login successful. Token received.")

    # 3. Access protected route WITHOUT token
    print("Accessing protected route WITHOUT token...")
    resp = requests.get(f"{BASE_URL}/users")
    if resp.status_code == 401:
        print("Success: Access denied as expected.")
    else:
        print(f"Failure: Expected 401, got {resp.status_code}")
        sys.exit(1)

    # 4. Access protected route WITH token
    print("Accessing protected route WITH token...")
    resp = requests.get(f"{BASE_URL}/users", headers={
        "x-access-token": token
    })
    if resp.status_code == 200:
        print("Success: Access granted.")
        users = resp.json().get("users", [])
        print(f"Retrieved {len(users)} users.")
    else:
        print(f"Failure: Expected 200, got {resp.status_code}")
        print(resp.text)
        sys.exit(1)

if __name__ == "__main__":
    try:
        test_jwt_flow()
        print("\nALL TESTS PASSED")
    except requests.exceptions.ConnectionError:
        print("\nError: Could not connect to server. Is it running?")
        sys.exit(1)
