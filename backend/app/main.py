from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine
from app.routers.auth import router as auth_router
from app.routers.complaints import router as complaints_router
from app.routers.admin import router as admin_router

app = FastAPI(
    title="Society Maintenance Tracker",
    version="1.0.0",
)


app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(admin_router)

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