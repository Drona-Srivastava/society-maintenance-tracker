def get_token(client, email, password):
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_admin_can_create_notice(client, admin):
    token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "title": "Water Supply Maintenance",
            "content": "Water supply will be interrupted tomorrow.",
            "is_important": True,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "Water Supply Maintenance"
    assert data["content"] == "Water supply will be interrupted tomorrow."
    assert data["is_important"] is True
    assert data["created_by"] == admin.id


def test_resident_can_read_notices(client, resident, admin):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    create_response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "title": "Community Meeting",
            "content": "Meeting this Sunday.",
            "is_important": False,
        },
    )

    assert create_response.status_code == 201

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.get(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    notices = response.json()

    assert len(notices) >= 1

    assert any(
        notice["title"] == "Community Meeting"
        for notice in notices
    )


def test_resident_can_get_notice(
    client,
    resident,
    admin,
):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    create_response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "title": "Parking Maintenance",
            "content": "Parking area maintenance on Saturday.",
            "is_important": False,
        },
    )

    notice_id = create_response.json()["id"]

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.get(
        f"/api/notices/{notice_id}",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == notice_id
    assert data["title"] == "Parking Maintenance"

def test_admin_can_update_notice(
    client,
    admin,
):
    token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    create_response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "title": "Old Title",
            "content": "Old content.",
            "is_important": False,
        },
    )

    assert create_response.status_code == 201

    notice_id = create_response.json()["id"]

    response = client.patch(
        f"/api/notices/{notice_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "title": "Updated Title",
            "content": "Updated content.",
            "is_important": True,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["title"] == "Updated Title"
    assert data["content"] == "Updated content."
    assert data["is_important"] is True

def test_admin_can_delete_notice(
    client,
    admin,
):
    token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    create_response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "title": "Temporary Notice",
            "content": "This notice will be deleted.",
            "is_important": False,
        },
    )

    notice_id = create_response.json()["id"]

    response = client.delete(
        f"/api/notices/{notice_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 204

    get_response = client.get(
        f"/api/notices/{notice_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert get_response.status_code == 404

def test_resident_cannot_create_notice(
    client,
    resident,
):
    token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "title": "Unauthorized Notice",
            "content": "Resident should not be able to create this.",
            "is_important": False,
        },
    )

    assert response.status_code == 403

def test_resident_cannot_update_notice(
    client,
    resident,
    admin,
):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    create_response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "title": "Original Notice",
            "content": "Original content.",
            "is_important": False,
        },
    )

    notice_id = create_response.json()["id"]

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.patch(
        f"/api/notices/{notice_id}",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        json={
            "title": "Hacked Notice",
        },
    )

    assert response.status_code == 403

def test_resident_cannot_delete_notice(
    client,
    resident,
    admin,
):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    create_response = client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "title": "Protected Notice",
            "content": "This should not be deleted by residents.",
            "is_important": False,
        },
    )

    notice_id = create_response.json()["id"]

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.delete(
        f"/api/notices/{notice_id}",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 403

def test_important_notices_appear_first(
    client,
    admin,
    resident,
):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "title": "Normal Notice",
            "content": "Normal announcement.",
            "is_important": False,
        },
    )

    client.post(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "title": "Important Notice",
            "content": "Important announcement.",
            "is_important": True,
        },
    )

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.get(
        "/api/notices",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    notices = response.json()

    important_index = next(
        i
        for i, notice in enumerate(notices)
        if notice["title"] == "Important Notice"
    )

    normal_index = next(
        i
        for i, notice in enumerate(notices)
        if notice["title"] == "Normal Notice"
    )

    assert important_index < normal_index

