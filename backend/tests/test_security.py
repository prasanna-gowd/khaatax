from tests.test_groups import get_auth_token

def test_cross_group_access_prevention(client):
    token_group_a_user = get_auth_token(client, "sec_a@example.com", "User Group A")
    token_group_b_user = get_auth_token(client, "sec_b@example.com", "User Group B")
    headers_a = {"Authorization": f"Bearer {token_group_a_user}"}
    headers_b = {"Authorization": f"Bearer {token_group_b_user}"}

    # Group A User creates Group A
    grp_a = client.post("/api/v1/groups", json={"name": "Private Group A"}, headers=headers_a).json()
    grp_a_id = grp_a["id"]

    # Group B User creates Group B
    grp_b = client.post("/api/v1/groups", json={"name": "Private Group B"}, headers=headers_b).json()

    # Group B User attempts to read Group A data -> 403 Forbidden
    resp = client.get(f"/api/v1/groups/{grp_a_id}", headers=headers_b)
    assert resp.status_code == 403
    assert "Access denied" in resp.json()["detail"]

    # Group B User attempts to view Group A transactions -> 403 Forbidden
    resp_tx = client.get(f"/api/v1/groups/{grp_a_id}/transactions", headers=headers_b)
    assert resp_tx.status_code == 403
