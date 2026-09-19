import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_real_auth():
    print("--- 1. Testing wrong password on existing user ---")
    res = client.post("/api/v1/auth/login", json={"email": "vendor@labelguard.gov.in", "password": "wrongpassword123"})
    print("Status:", res.status_code, "Response:", res.json())
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    assert "Invalid email or password" in res.json().get("detail", "")

    print("\n--- 2. Testing non-existent user login (must NOT auto-create) ---")
    res = client.post("/api/v1/auth/login", json={"email": "randomnonexistentuser999@test.com", "password": "anyPassword123!"})
    print("Status:", res.status_code, "Response:", res.json())
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    assert "Invalid email or password" in res.json().get("detail", "")

    print("\n--- 3. Testing correct password on seeded user ---")
    res = client.post("/api/v1/auth/login", json={"email": "vendor@labelguard.gov.in", "password": "demo1234"})
    print("Status:", res.status_code, "User:", res.json().get("user", {}).get("full_name"), "Role:", res.json().get("user", {}).get("role"))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json().get("access_token") is not None

    test_email = f"realuser_{int(Path(__file__).stat().st_mtime)}@testcompany.org"
    test_pwd = "MySecretPassword2026!"

    print(f"\n--- 4. Registering a real user: {test_email} ---")
    reg_payload = {
        "email": test_email,
        "password": test_pwd,
        "full_name": "Test Real Manufacturer Admin",
        "role": "vendor",
        "company_name": "Apex Packaged Goods Ltd",
        "gst_number": "07AAACA1234B1Z5",
        "lut_number": "LUT/DEL/2026/001",
        "entity_category": "Manufacturer / Packer",
        "address": "Okhla Phase III, New Delhi 110020",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    print("Status:", res.status_code, "Created user:", res.json().get("user"))
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    assert res.json()["user"]["company_name"] == "Apex Packaged Goods Ltd"
    assert res.json()["user"]["gst_number"] == "07AAACA1234B1Z5"

    print("\n--- 5. Duplicate registration test (must reject) ---")
    res = client.post("/api/v1/auth/register", json=reg_payload)
    print("Status:", res.status_code, "Response:", res.json())
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"

    print("\n--- 6. Login with real created user and WRONG password ---")
    res = client.post("/api/v1/auth/login", json={"email": test_email, "password": "IncorrectPassword!"})
    print("Status:", res.status_code, "Response:", res.json())
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

    print("\n--- 7. Login with real created user and CORRECT password ---")
    res = client.post("/api/v1/auth/login", json={"email": test_email, "password": test_pwd})
    print("Status:", res.status_code, "Token received:", bool(res.json().get("access_token")), "User company:", res.json().get("user", {}).get("company_name"))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json()["user"]["company_name"] == "Apex Packaged Goods Ltd"

    print("\nALL BACKEND AUTH TESTS PASSED!")

if __name__ == "__main__":
    test_real_auth()
