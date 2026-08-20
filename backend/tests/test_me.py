def test_me(client, resident):
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "Resident@123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == resident.id
    assert data["email"] == "resident@test.com"
    assert data["role"] == "resident"


def test_me_without_token(client):
    response = client.get("/api/auth/me")

    assert response.status_code in (401, 403)