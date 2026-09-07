from tests.test_groups import get_auth_token

def test_full_ledger_balance_calculation(client):
    token_a = get_auth_token(client, "bal_a@example.com", "Prasanna")
    token_b = get_auth_token(client, "bal_b@example.com", "Rahul")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Fetch User IDs
    me_a = client.get("/api/v1/auth/me", headers=headers_a).json()
    me_b = client.get("/api/v1/auth/me", headers=headers_b).json()

    # Get categories
    cats = client.get("/api/v1/categories", headers=headers_a).json()
    cat_food_id = next(c["id"] for c in cats if c["name"] == "Food")

    # Create & Join Group
    grp = client.post("/api/v1/groups", json={"name": "Trips"}, headers=headers_a).json()
    g_id = grp["id"]
    client.post("/api/v1/groups/join", json={"code": grp["code"]}, headers=headers_b)

    # 1. Prasanna pays ₹1000 dinner (50/50 split)
    client.post(f"/api/v1/groups/{g_id}/transactions", json={
        "amount": 1000.0,
        "transaction_type": "EXPENSE",
        "description": "Dinner",
        "category_id": cat_food_id,
        "paid_by": me_a["id"],
        "split_type": "50_50"
    }, headers=headers_a)

    bal1 = client.get(f"/api/v1/groups/{g_id}/balance", headers=headers_a).json()
    assert bal1["status"] == "you_are_owed"
    assert bal1["amount"] == 500.0

    bal1_b = client.get(f"/api/v1/groups/{g_id}/balance", headers=headers_b).json()
    assert bal1_b["status"] == "you_owe"
    assert bal1_b["amount"] == 500.0

    # 2. Rahul settles ₹300 via UPI
    client.post(f"/api/v1/groups/{g_id}/settle", json={
        "payee_id": me_a["id"],
        "amount": 300.0,
        "payment_method": "UPI",
        "reference_note": "Partial settlement"
    }, headers=headers_b)

    bal2 = client.get(f"/api/v1/groups/{g_id}/balance", headers=headers_a).json()
    assert bal2["status"] == "you_are_owed"
    assert bal2["amount"] == 200.0

    # 3. Rahul settles remaining ₹200
    client.post(f"/api/v1/groups/{g_id}/settle", json={
        "payee_id": me_a["id"],
        "amount": 200.0,
        "payment_method": "CASH"
    }, headers=headers_b)

    bal3 = client.get(f"/api/v1/groups/{g_id}/balance", headers=headers_a).json()
    assert bal3["status"] == "settled"
    assert bal3["amount"] == 0.0
