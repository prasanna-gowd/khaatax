from tests.test_groups import get_auth_token

def test_ai_text_parsing_and_query(client):
    token_a = get_auth_token(client, "ai_user_a@example.com", "Prasanna AI")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Create Group
    grp = client.post("/api/v1/groups", json={"name": "AI Test Group"}, headers=headers_a).json()
    g_id = grp["id"]

    # 1. Test AI parse expense text
    parse_resp = client.post(f"/api/v1/groups/{g_id}/ai/parse-text", json={
        "text": "I paid 650 for dinner yesterday"
    }, headers=headers_a)
    assert parse_resp.status_code == 200
    p_data = parse_resp.json()
    assert p_data["amount"] == 650.0
    assert p_data["category_name"] == "Food"

    # 2. Test AI natural language query
    query_resp = client.post(f"/api/v1/groups/{g_id}/ai/query", json={
        "query": "Who owes whom?"
    }, headers=headers_a)
    assert query_resp.status_code == 200
    q_data = query_resp.json()
    assert "settled" in q_data["answer"].lower()
