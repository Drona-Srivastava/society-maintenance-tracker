def test_resident_dashboard(
    client,
    resident,
    resident_token,
):
    response = client.get(
        "/api/dashboard",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["complaints"]["total"] == 0
    assert data["complaints"]["open"] == 0
    assert data["complaints"]["in_progress"] == 0
    assert data["complaints"]["resolved"] == 0
    assert data["recent_complaints"] == []
    assert data["important_notices"] == []


def test_resident_dashboard_only_shows_own_complaints(
    client,
    resident,
    second_resident,
    resident_token,
    second_resident_token,
):
    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {second_resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Second resident complaint.",
        },
    )

    assert response.status_code == 201

    response = client.get(
        "/api/dashboard",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["complaints"]["total"] == 0
    assert data["recent_complaints"] == []


def test_resident_dashboard_requires_authentication(client):
    response = client.get("/api/dashboard")

    assert response.status_code in (401, 403)