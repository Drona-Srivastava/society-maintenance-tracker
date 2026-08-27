from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def main():
    db = SessionLocal()

    try:
        email = "admin@society.local"

        existing = db.scalar(
            select(User).where(User.email == email)
        )

        if existing:
            print("Admin already exists.")
            return

        admin = User(
            name="Society Administrator",
            email=email,
            password_hash=hash_password("Admin@12345"),
            role="admin",
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    main()