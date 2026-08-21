from datetime import datetime, timedelta, timezone

from app.models.complaint import (
    Complaint,
    ComplaintPriority,
    ComplaintStatus,
)

def test_admin_can_list_complaints(client, admin_token, admin):

    response = client.get(
        "/api/admin/complaints",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 403


def test_admin_can_list_complaints(
    client,
    admin_token,
    admin,
):

    response = client.get(
        "/api/admin/complaints",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_admin_can_move_complaint_to_in_progress(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
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
    admin_token,
    resident,
    resident_token,
):
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
    admin_token,
    resident,
    resident_token,
):
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
    admin_token,
):
    response = client.get(
        "/api/admin/dashboard",
        headers={
            "Authorization": f"Bearer {admin_token}",
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
    resident_token,
):
    response = client.get(
        "/api/admin/dashboard",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
    )

    assert response.status_code == 403

def test_admin_can_filter_complaints_by_status(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
    # Create two complaints
    first = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Broken pipe.",
        },
    )
    assert first.status_code == 201

    second = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Electrical",
            "description": "Broken light.",
        },
    )
    assert second.status_code == 201

    # Move second complaint to in_progress
    response = client.patch(
        f"/api/admin/complaints/{second.json()['id']}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "status": "in_progress",
        },
    )
    assert response.status_code == 200

    response = client.get(
        "/api/admin/complaints?status=open",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    complaints = response.json()

    assert all(
        complaint["status"] == "open"
        for complaint in complaints
    )

def test_admin_can_filter_complaints_by_priority(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Water leakage.",
        },
    )

    assert response.status_code == 201

    complaint_id = response.json()["id"]

    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "priority": "high",
        },
    )

    assert response.status_code == 200

    response = client.get(
        "/api/admin/complaints?priority=high",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    complaints = response.json()

    assert all(
        complaint["priority"] == "high"
        for complaint in complaints
    )

def test_admin_can_filter_complaints_by_category(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
    for category in ["Plumbing", "Electrical"]:
        response = client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {resident_token}",
            },
            data={
                "category": category,
                "description": f"{category} issue.",
            },
        )

        assert response.status_code == 201

    response = client.get(
        "/api/admin/complaints?category=plumbing",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    complaints = response.json()

    assert complaints
    assert all(
        complaint["category"].lower() == "plumbing"
        for complaint in complaints
    )

def test_admin_complaint_pagination(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
    for i in range(5):
        response = client.post(
            "/api/complaints",
            headers={
                "Authorization": f"Bearer {resident_token}",
            },
            data={
                "category": "General",
                "description": f"Test complaint {i}",
            },
        )

        assert response.status_code == 201

    response = client.get(
        "/api/admin/complaints?page=1&limit=2",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200
    assert len(response.json()) == 2

def test_admin_can_combine_complaint_filters(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Plumbing",
            "description": "Major pipe leakage.",
        },
    )

    assert response.status_code == 201

    complaint_id = response.json()["id"]

    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={
            "priority": "high",
        },
    )

    assert response.status_code == 200

    response = client.get(
        "/api/admin/complaints"
        "?status=open"
        "&priority=high"
        "&category=plumbing",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    complaints = response.json()

    assert complaints

    for complaint in complaints:
        assert complaint["status"] == "open"
        assert complaint["priority"] == "high"
        assert complaint["category"].lower() == "plumbing"

def test_admin_overdue_complaints_appear_first(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
    db,
):
    # Create an old complaint that should be overdue.
    overdue_complaint = Complaint(
        resident_id=resident.id,
        category="Plumbing",
        description="Old water leakage complaint.",
        status=ComplaintStatus.OPEN,
        priority=ComplaintPriority.MEDIUM,
        created_at=datetime.now(timezone.utc) - timedelta(days=5),
    )

    # Create a recent complaint that should not be overdue.
    recent_complaint = Complaint(
        resident_id=resident.id,
        category="Electrical",
        description="Recent electrical complaint.",
        status=ComplaintStatus.OPEN,
        priority=ComplaintPriority.MEDIUM,
        created_at=datetime.now(timezone.utc),
    )

    db.add_all([
        overdue_complaint,
        recent_complaint,
    ])
    db.flush()

    response = client.get(
        "/api/admin/complaints",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    complaints = response.json()

    overdue = next(
        complaint
        for complaint in complaints
        if complaint["id"] == overdue_complaint.id
    )

    recent = next(
        complaint
        for complaint in complaints
        if complaint["id"] == recent_complaint.id
    )

    assert overdue["is_overdue"] is True
    assert recent["is_overdue"] is False

    overdue_index = next(
        index
        for index, complaint in enumerate(complaints)
        if complaint["id"] == overdue_complaint.id
    )

    recent_index = next(
        index
        for index, complaint in enumerate(complaints)
        if complaint["id"] == recent_complaint.id
    )

    assert overdue_index < recent_index

def test_resolving_complaint_sets_resolved_at(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
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

    # OPEN → IN_PROGRESS
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
    assert response.json()["resolved_at"] is None

    # IN_PROGRESS → RESOLVED
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

    data = response.json()

    assert data["status"] == "resolved"
    assert data["resolved_at"] is not None

def test_reopening_complaint_clears_resolved_at(
    client,
    admin,
    admin_token,
    resident,
    resident_token,
):
    create_response = client.post(
        "/api/complaints",
        headers={
            "Authorization": f"Bearer {resident_token}",
        },
        data={
            "category": "Electrical",
            "description": "Corridor light is broken.",
        },
    )

    complaint_id = create_response.json()["id"]

    # OPEN → IN_PROGRESS
    client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={"status": "in_progress"},
    )

    # IN_PROGRESS → RESOLVED
    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={"status": "resolved"},
    )

    assert response.status_code == 200
    assert response.json()["resolved_at"] is not None

    # RESOLVED → OPEN
    response = client.patch(
        f"/api/admin/complaints/{complaint_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
        json={"status": "open"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "open"
    assert data["resolved_at"] is None

