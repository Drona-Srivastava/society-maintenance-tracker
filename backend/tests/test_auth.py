def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New Resident",
            "email": "newresident@test.com",
            "password": "Password@123",
            "phone": "9876543210",
            "address": "Flat 101, VIT Society, Chennai",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "New Resident"
    assert data["email"] == "newresident@test.com"
    assert data["phone"] == "9876543210"
    assert data["address"] == "Flat 101, VIT Society, Chennai"
    assert data["profile_picture_url"] is None
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email(client):
    payload = {
        "name": "Resident",
        "email": "duplicate@test.com",
        "password": "Password@123",
        "phone": "9876543211",
        "address": "Flat 202, VIT Society, Chennai",
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

def test_user_can_update_profile(client):
    register_response = client.post(
        "/api/auth/register",
        json={
            "name": "Profile User",
            "email": "profile@test.com",
            "password": "Password@123",
            "phone": "9876543210",
            "address": "Flat 101, Chennai",
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "profile@test.com",
            "password": "Password@123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.patch(
        "/api/auth/profile",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "name": "Updated User",
            "phone": "9876543211",
            "address": "Flat 202, Chennai",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Updated User"
    assert data["phone"] == "9876543211"
    assert data["address"] == "Flat 202, Chennai"

def test_user_can_partially_update_profile(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Partial User",
            "email": "partial@test.com",
            "password": "Password@123",
            "phone": "9876543212",
            "address": "Flat 301, Chennai",
        },
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "partial@test.com",
            "password": "Password@123",
        },
    )

    token = login_response.json()["access_token"]

    response = client.patch(
        "/api/auth/profile",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "phone": "9876543213",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["phone"] == "9876543213"
    assert data["name"] == "Partial User"
    assert data["address"] == "Flat 301, Chennai"

def test_update_profile_requires_authentication(client):
    response = client.patch(
        "/api/auth/profile",
        json={
            "name": "Hacker",
        },
    )

    assert response.status_code == 401

def test_update_profile_rejects_empty_update(client, resident):
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "Resident@123",
        },
    )

    token = login_response.json()["access_token"]

    response = client.patch(
        "/api/auth/profile",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "No changes provided"

def test_user_can_upload_profile_picture(
    client,
    resident,
    monkeypatch,
):
    async def fake_save_file(file, upload_dir):
        return "/uploads/profiles/test-profile.jpg"

    monkeypatch.setattr(
        "app.routers.auth.save_file",
        fake_save_file,
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "Resident@123",
        },
    )

    token = login_response.json()["access_token"]

    response = client.post(
        "/api/auth/profile-picture",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "profile.jpg",
                b"\xff\xd8\xff\xe0" + b"\x00" * 100,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == resident.id
    assert data["profile_picture_url"] is not None
    assert data["profile_picture_url"].startswith(
        "/uploads/profiles/"
    )

def test_profile_picture_requires_authentication(client):
    response = client.post(
        "/api/auth/profile-picture",
        files={
            "file": (
                "profile.jpg",
                b"\xff\xd8\xff\xe0" + b"\x00" * 100,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 401

def test_profile_picture_rejects_invalid_file_type(
    client,
    resident,
):
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "Resident@123",
        },
    )

    token = login_response.json()["access_token"]

    response = client.post(
        "/api/auth/profile-picture",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "malware.txt",
                b"this is not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Only JPEG, PNG, and WebP images are allowed"
    )

def test_profile_picture_rejects_oversized_file(
    client,
    resident,
):
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "Resident@123",
        },
    )

    token = login_response.json()["access_token"]

    oversized_image = b"\xff\xd8" + (
        b"x" * (5 * 1024 * 1024 + 1)
    )

    response = client.post(
        "/api/auth/profile-picture",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "large.jpg",
                oversized_image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 413