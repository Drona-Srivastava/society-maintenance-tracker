def test_create_complaint(client, resident_token, resident):
    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
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


def test_get_my_complaints(client, resident_token, resident):
    create_response = client.post(
        "/api/complaints",
        headers={
           "Authorization": f"Bearer {resident_token}",
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
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1
    assert data["page"] == 1
    assert data["limit"] == 10
    assert data["total_pages"] >= 1

    assert any(
        complaint["description"]
        == "Corridor light is not working."
        for complaint in data["items"]
    )

def test_get_complaint_details(client, resident_token, resident):

    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
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
            "Authorization": f"Bearer {resident_token}",
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
    resident_token,
    second_resident_token,
):
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
            "Authorization": f"Bearer {second_resident_token}",
        },
    )

    assert response.status_code == 403

def test_complaint_history(client, resident_token, resident):
    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
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
            "Authorization": f"Bearer {resident_token}",
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

def test_create_complaint_with_photo(
    client,
    resident_token,
    resident,
    monkeypatch,
):
    async def fake_save_file(file, upload_dir):
        return "/uploads/complaints/test-photo.jpg"

    monkeypatch.setattr(
        "app.routers.complaints.save_file",
        fake_save_file,
    )

    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Water leaking from the bathroom pipe.",
        },
        files={
            "photo": (
                "leak.jpg",
                b"\xff\xd8\xff\xe0" + b"\x00" * 100,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["resident_id"] == resident.id


def test_create_complaint_rejects_invalid_photo(client, resident_token, resident):    
    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Water leaking from the bathroom pipe.",
        },
        files={
            "photo": (
                "notes.txt",
                b"not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Only JPEG, PNG, and WebP images are allowed"
    )
def test_create_complaint_rejects_oversized_photo(
    client,
    resident_token,
    resident,
):
    oversized_image = b"\xff\xd8" + (
        b"x" * (5 * 1024 * 1024 + 1)
    )

    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Water leaking from the bathroom pipe.",
        },
        files={
            "photo": (
                "large.jpg",
                oversized_image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 413

def test_get_my_complaints_pagination(client, resident_token, resident):
    for i in range(5):
        response = client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {resident_token}",
            },
            data={
                "category": "Plumbing",
                "description": f"Test complaint number {i}.",
            },
        )

        assert response.status_code == 201

    response = client.get(
        "/api/complaints?page=1&limit=2",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 5
    assert data["page"] == 1
    assert data["limit"] == 2
    assert data["total_pages"] == 3
    assert len(data["items"]) == 2

    response = client.get(
        "/api/complaints?page=2&limit=2",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 2
    assert len(data["items"]) == 2

    response = client.get(
        "/api/complaints?page=3&limit=2",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 3
    assert len(data["items"]) == 1