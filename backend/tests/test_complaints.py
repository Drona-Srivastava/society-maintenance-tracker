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


def test_create_complaint(client, resident):
    token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {token}",
        },
        data={
            "category": "Plumbing",
            "description": "Water is leaking from the ceiling.",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["resident_id"] == resident.id
    assert data["category"] == "Plumbing"
    assert data["description"] == "Water is leaking from the ceiling."
    assert data["status"] == "open"
    assert data["priority"] == "medium"
    assert data["photo_url"] is None
    assert data["is_overdue"] is False


def test_get_my_complaints(client, resident):
    token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {token}",
        },
        data={
            "category": "Electrical",
            "description": "Corridor light is not working.",
        },
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1

    assert any(
        complaint["description"]
        == "Corridor light is not working."
        for complaint in data
    )

def test_get_complaint_details(client, resident):
    token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {token}",
        },
        data={
            "category": "Water",
            "description": "Low water pressure.",
        },
    )

    complaint_id = create_response.json()["id"]

    response = client.get(
        f"/api/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == complaint_id
    assert data["resident_id"] == resident.id
    assert data["category"] == "Water"

def test_resident_cannot_access_other_resident_complaint(
    client,
    resident,
    second_resident,
):
    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    second_token = get_token(
        client,
        "resident2@test.com",
        "Resident2@123",
    )

    # Resident 1 creates a complaint
    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Private complaint belonging to resident 1.",
        },
    )

    assert create_response.status_code == 201

    complaint_id = create_response.json()["id"]

    # Resident 2 tries to access it
    response = client.get(
        f"/api/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {second_token}",
        },
    )

    assert response.status_code == 403

def test_complaint_history(client, resident):
    token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {token}",
        },
        data={
            "category": "Plumbing",
            "description": "Pipe is leaking.",
        },
    )

    complaint_id = create_response.json()["id"]

    response = client.get(
        f"/api/complaints/{complaint_id}/history",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    history = response.json()

    assert len(history) >= 1

    assert any(
        item["new_status"] == "open"
        for item in history
    )

def test_complaints_require_authentication(client):
    response = client.get("/api/complaints")

    assert response.status_code in (401, 403)