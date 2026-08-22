from fastapi import FastAPI
from sqlalchemy import text
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.routers.auth import router as auth_router
from app.routers import dashboard
from app.routers.complaints import router as complaints_router
from app.routers.admin import router as admin_router
from app.routers.notices import router as notices_router
from app.models.password_reset import PasswordResetOTP
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Society Maintenance Tracker",
    version="1.0.0",
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(admin_router)
app.include_router(notices_router)
app.include_router(dashboard.router)

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "society-maintenance-tracker",
    }


@app.get("/health/db")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }