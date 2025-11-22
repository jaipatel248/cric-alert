"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.core.config import settings
from app.api.routes import alerts, matches, health, websocket
from app.services.alert_service import alert_service

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
app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])

@app.on_event("startup")
async def startup_event():
    """Application startup"""
    print(f"🚀 {settings.APP_NAME} started!")
    print(f"📡 API running on {settings.HOST}:{settings.PORT}")
    print(f"📚 Docs available at http://{settings.HOST}:{settings.PORT}/docs")

    # Restart monitors that were running before shutdown
    monitors_to_restart = alert_service.get_monitors_to_restart()
    if monitors_to_restart:
        print(f"\n🔄 Restarting {len(monitors_to_restart)} monitor(s)...")
        for monitor_id in monitors_to_restart:
            # Mark as running
            alert_service.active_monitors[monitor_id]["running"] = True
            # Start monitoring in background
            asyncio.create_task(alert_service.monitor_match(monitor_id))
            print(f"  ✅ Restarted monitor {monitor_id}")
        print()

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
