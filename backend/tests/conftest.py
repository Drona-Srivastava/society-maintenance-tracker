import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.user import User


TEST_DATABASE_URL = settings.TEST_DATABASE_URL

if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL is not configured")


engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

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

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()

    session = TestingSessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def resident(db):
    user = User(
        name="Test Resident",
        email="resident@test.com",
        password_hash=hash_password("Resident@123"),
        role="resident",
    )

    db.add(user)
    db.flush()

    return user


@pytest.fixture
def admin(db):
    user = User(
        name="Test Admin",
        email="admin@test.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
    )

    db.add(user)
    db.flush()

    return user

@pytest.fixture
def second_resident(db):
    user = User(
        name="Second Resident",
        email="resident2@test.com",
        password_hash=hash_password("Resident2@123"),
        role="resident",
    )

    db.add(user)
    db.flush()

    return user

@pytest.fixture
def resident_token(client, resident):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "resident@test.com",
            "password": "Resident@123",
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


@pytest.fixture
def admin_token(client, admin):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123",
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


@pytest.fixture
def second_resident_token(client, second_resident):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "resident2@test.com",
            "password": "Resident2@123",
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]