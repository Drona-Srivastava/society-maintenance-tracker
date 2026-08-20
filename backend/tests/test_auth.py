def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New Resident",
            "email": "newresident@test.com",
            "password": "Password@123",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "New Resident"
    assert data["email"] == "newresident@test.com"
    assert data["role"] == "resident"
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email(client):
    payload = {
        "name": "Resident",
        "email": "duplicate@test.com",
        "password": "Password@123",
    }

    first = client.post(
        "/api/auth/register",
        json=payload,
    )

    assert first.status_code == 201

    second = client.post(
        "/api/auth/register",
        json=payload,
    )

    assert second.status_code == 409


def test_login(client, resident):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "Resident@123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, resident):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "WrongPassword",
        },
    )

    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "doesnotexist@test.com",
            "password": "Password@123",
        },
    )

    assert response.status_code == 401