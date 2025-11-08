"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import alerts, matches, health

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time cricket match alerts and monitoring API",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(matches.router, prefix="/api/v1/matches", tags=["matches"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])

@app.on_event("startup")
async def startup_event():
    """Application startup"""
    print(f"🚀 {settings.APP_NAME} started!")
    print(f"📡 API running on {settings.HOST}:{settings.PORT}")
    print(f"📚 Docs available at http://{settings.HOST}:{settings.PORT}/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    print(f"🛑 Shutting down {settings.APP_NAME}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs"
    }
