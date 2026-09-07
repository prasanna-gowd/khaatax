def get_auth_token(client, email, name):
    resp = client.post("/api/v1/auth/register", json={
        "name": name,
        "email_or_phone": email,
        "password": "password123"
    })
    return resp.json()["access_token"]

def test_create_and_join_group_with_limit(client):
    token_u1 = get_auth_token(client, "g_u1@example.com", "User 1")
    token_u2 = get_auth_token(client, "g_u2@example.com", "User 2")
    token_u3 = get_auth_token(client, "g_u3@example.com", "User 3")

    headers_1 = {"Authorization": f"Bearer {token_u1}"}
    headers_2 = {"Authorization": f"Bearer {token_u2}"}
    headers_3 = {"Authorization": f"Bearer {token_u3}"}

    # 1. Create Group
    create_resp = client.post("/api/v1/groups", json={"name": "Flat 101"}, headers=headers_1)
    assert create_resp.status_code == 201
    group_data = create_resp.json()
    group_code = group_data["code"]
    group_id = group_data["id"]

    # 2. Join Group (User 2)
    join_resp = client.post("/api/v1/groups/join", json={"code": group_code}, headers=headers_2)
    assert join_resp.status_code == 200
    assert len(join_resp.json()["members"]) == 2

    # 3. Join Group (User 3) -> MUST FAIL WITH 400
    join_3_resp = client.post("/api/v1/groups/join", json={"code": group_code}, headers=headers_3)
    assert join_3_resp.status_code == 400
    assert "This group already has two members." in join_3_resp.json()["detail"]
