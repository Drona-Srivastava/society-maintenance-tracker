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


def test_resident_cannot_access_admin_complaints(
    client,
    resident,
):
    token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.get(
        "/api/admin/complaints",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 403


def test_admin_can_list_complaints(
    client,
    admin,
):
    token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    response = client.get(
        "/api/admin/complaints",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_admin_can_move_complaint_to_in_progress(
    client,
    admin,
    resident,
):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Broken pipe.",
        },
    )

    assert create_response.status_code == 201

    complaint_id = create_response.json()["id"]

    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "status": "in_progress",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"

def test_admin_can_resolve_in_progress_complaint(
    client,
    admin,
    resident,
):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Electrical",
            "description": "Broken corridor light.",
        },
    )

    complaint_id = create_response.json()["id"]

    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "status": "in_progress",
        },
    )

    assert response.status_code == 200

    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "status": "resolved",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "resolved"

def test_admin_cannot_resolve_open_complaint_directly(
    client,
    admin,
    resident,
):
    admin_token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    resident_token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Water",
            "description": "No water supply.",
        },
    )

    complaint_id = create_response.json()["id"]

    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "status": "resolved",
        },
    )

    assert response.status_code == 400

def test_admin_dashboard(
    client,
    admin,
):
    token = get_token(
        client,
        "admin@test.com",
        "Admin@123",
    )

    response = client.get(
        "/api/admin/dashboard",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "complaints" in data
    assert "total_residents" in data
    assert "total_notices" in data

    assert "total" in data["complaints"]
    assert "open" in data["complaints"]
    assert "in_progress" in data["complaints"]
    assert "resolved" in data["complaints"]
    assert "overdue" in data["complaints"]


def test_resident_cannot_access_dashboard(
    client,
    resident,
):
    token = get_token(
        client,
        "resident@test.com",
        "Resident@123",
    )

    response = client.get(
        "/api/admin/dashboard",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 403