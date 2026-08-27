"""Replace complaint demo data with realistic records.

Run from the backend directory with:
    python -m scripts.reset_demo_complaints --apply

The explicit flag is intentional: this operation removes every complaint and
its history, while leaving users, notices, and password-reset records intact.
"""

import argparse
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.complaint import Complaint, ComplaintPriority, ComplaintStatus
from app.models.complaint_history import ComplaintHistory
from app.models.user import User


DEMO_COMPLAINTS = [
    {
        "category": "Plumbing",
        "description": "Water is seeping from the ceiling near the lift lobby on the third floor. It becomes noticeably worse after the overhead tank is filled.",
        "status": ComplaintStatus.IN_PROGRESS,
        "priority": ComplaintPriority.HIGH,
        "age_days": 2,
        "note": "Maintenance team assigned to inspect the overhead tank line.",
    },
    {
        "category": "Electrical",
        "description": "The corridor light outside Flat B-204 has been flickering since yesterday evening and goes out for several minutes at a time.",
        "status": ComplaintStatus.OPEN,
        "priority": ComplaintPriority.MEDIUM,
        "age_days": 1,
        "note": None,
    },
    {
        "category": "Lift",
        "description": "The lift makes a grinding sound while stopping at the fourth floor. Please arrange an inspection before it becomes a safety issue.",
        "status": ComplaintStatus.OPEN,
        "priority": ComplaintPriority.HIGH,
        "age_days": 4,
        "note": None,
    },
    {
        "category": "Common Area",
        "description": "The tile at the entrance to the clubhouse is loose and shifts underfoot. It would be helpful to have it secured before someone trips.",
        "status": ComplaintStatus.RESOLVED,
        "priority": ComplaintPriority.LOW,
        "age_days": 7,
        "note": "Loose tile replaced and area checked by the maintenance team.",
    },
]

DEMO_ACCOUNTS = [
    {
        "name": "Demo Resident",
        "email": "resident@example.com",
        "password": "Resident@123",
        "role": "resident",
    },
    {
        "name": "Society Administrator",
        "email": "admin@society.local",
        "password": "Admin@12345",
        "role": "admin",
    },
]


def reset_demo_complaints() -> int:
    db = SessionLocal()
    try:
        for account in DEMO_ACCOUNTS:
            user = db.scalar(select(User).where(User.email == account["email"]))
            if user is None:
                user = User(
                    name=account["name"],
                    email=account["email"],
                    password_hash=hash_password(account["password"]),
                    role=account["role"],
                )
                db.add(user)
            else:
                user.password_hash = hash_password(account["password"])
                user.role = account["role"]
        db.flush()

        residents = db.scalars(
            select(User).where(User.role == "resident").order_by(User.id)
        ).all()
        if not residents:
            raise RuntimeError("No resident accounts exist; create a resident before seeding complaints.")

        admin = db.scalar(select(User).where(User.role == "admin").order_by(User.id))
        db.execute(delete(ComplaintHistory))
        db.execute(delete(Complaint))

        now = datetime.now(timezone.utc)
        for index, data in enumerate(DEMO_COMPLAINTS):
            created_at = now - timedelta(days=data["age_days"])
            complaint = Complaint(
                resident_id=residents[index % len(residents)].id,
                category=data["category"],
                description=data["description"],
                status=data["status"],
                priority=data["priority"],
                created_at=created_at,
                updated_at=created_at,
                resolved_at=(created_at + timedelta(days=1) if data["status"] == ComplaintStatus.RESOLVED else None),
            )
            db.add(complaint)
            db.flush()

            db.add(ComplaintHistory(
                complaint_id=complaint.id,
                actor_id=residents[index % len(residents)].id,
                old_status=None,
                new_status=ComplaintStatus.OPEN.value,
                note="Complaint created",
                created_at=created_at,
            ))

            if data["status"] != ComplaintStatus.OPEN:
                db.add(ComplaintHistory(
                    complaint_id=complaint.id,
                    actor_id=admin.id if admin else complaint.resident_id,
                    old_status=ComplaintStatus.OPEN.value,
                    new_status=data["status"].value,
                    note=data["note"],
                    created_at=created_at + timedelta(hours=3),
                ))

        db.commit()
        return len(DEMO_COMPLAINTS)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="delete existing complaint data and seed demo records")
    args = parser.parse_args()
    if not args.apply:
        parser.error("refusing to modify the database without --apply")
    print(f"Seeded {reset_demo_complaints()} realistic demo complaints.")
