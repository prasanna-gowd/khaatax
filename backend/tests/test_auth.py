def test_register_and_login(client):
    # Register User 1
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": "Prasanna",
        "email_or_phone": "prasanna_test@example.com",
        "password": "securepassword123"
    })
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["name"] == "Prasanna"

    # Login User 1
    login_resp = client.post("/api/v1/auth/login", json={
        "email_or_phone": "prasanna_test@example.com",
        "password": "securepassword123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Get Me
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email_or_phone"] == "prasanna_test@example.com"

def test_duplicate_registration(client):
    client.post("/api/v1/auth/register", json={
        "name": "User Dup",
        "email_or_phone": "dup@example.com",
        "password": "password123"
    })
    resp = client.post("/api/v1/auth/register", json={
        "name": "User Dup 2",
        "email_or_phone": "dup@example.com",
        "password": "password123"
    })
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]
