from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.users import router as users_router
from app.api.profiles import router as profiles_router
from app.api.projects import router as projects_router
from app.api.collaborations import router as collaborations_router
from app.api.subscriptions import router as subscriptions_router
from app.api.notifications import router as notifications_router
from app.api.analytics import router as analytics_router
from app.api.auth_routes import router as auth_router  # Import auth router directly
from app.api.auth.google import router as google_auth_router
from app.api.admin import router as admin_router
from app.api.search_advanced import router as search_advanced_router
from app.api.payments import router as payments_router
from app.database import engine, Base
from app.core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Collabthon - College Student Collaboration Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=settings.ALLOW_ORIGIN_REGEX,
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(google_auth_router, prefix="/api/v1/auth", tags=["Google Authentication"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(profiles_router, prefix="/api/v1/profiles", tags=["Profiles"])
app.include_router(projects_router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(collaborations_router, prefix="/api/v1/collaborations", tags=["Collaborations"])
app.include_router(subscriptions_router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin Panel"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(search_advanced_router, prefix="/api/v1/search-advanced", tags=["Advanced Search"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])




@app.get("/")
async def root():
    return {
        "message": "Welcome to Collabthon API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Collabthon API"}