from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.auth import router as auth_router
from app.booking import router as booking_router
from app.audit import router as audit_router
from app.notifications import router as notifications_router
from app.database import init_db
from app.profile import router as profile_router

init_db()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(booking_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(profile_router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health")
async def api_health():
    return {"status": "ok"}
