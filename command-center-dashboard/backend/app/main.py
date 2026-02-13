import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn

from app.config import settings
from app.database import get_db, init_database
from app.routes import dashboard, metrics, auth, projects, resources, alerts
from app.ws_manager import WebSocketManager
from app.services.metrics_collector import MetricsCollector
from app.services.data_pipeline import DataPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
ws_manager = WebSocketManager()
metrics_collector = MetricsCollector()
data_pipeline = DataPipeline()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic"""
    logger.info("Starting Command Center Dashboard API...")
    
    # Initialize database
    await init_database()
    
    # Start background services
    await ws_manager.start()
    await metrics_collector.start()
    await data_pipeline.start()
    
    logger.info("All services started successfully")
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down services...")
    await ws_manager.stop()
    await metrics_collector.stop()
    await data_pipeline.stop()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Command Center Dashboard API",
    description="Enterprise-grade dashboard API for operational visibility",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "timestamp": metrics_collector.get_current_timestamp()
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Command Center Dashboard API",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "status": "operational"
    }


# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["resources"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])


# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "type": "http_error"}
    )


@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "type": "value_error"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "internal_error"}
    )


# Background task for periodic updates
async def broadcast_updates():
    """Broadcast real-time updates to WebSocket clients"""
    try:
        # Get latest metrics
        overview_data = await metrics_collector.get_executive_overview()
        realtime_data = await metrics_collector.get_realtime_metrics()
        projects_data = await metrics_collector.get_project_status()
        resources_data = await metrics_collector.get_resource_utilization()
        alerts_data = await metrics_collector.get_active_alerts()
        
        # Broadcast to different rooms
        await ws_manager.broadcast_to_room("dashboard:overview", {
            "type": "executive.overview",
            "data": overview_data
        })
        
        await ws_manager.broadcast_to_room("metrics:realtime", {
            "type": "metrics.realtime",
            "data": realtime_data
        })
        
        await ws_manager.broadcast_to_room("projects:status", {
            "type": "projects.update",
            "data": projects_data
        })
        
        await ws_manager.broadcast_to_room("resources:utilization", {
            "type": "resources.update",
            "data": resources_data
        })
        
        await ws_manager.broadcast_to_room("alerts:all", {
            "type": "alerts.update",
            "data": alerts_data
        })
        
    except Exception as e:
        logger.error(f"Error broadcasting updates: {e}")


@app.on_event("startup")
async def startup_background_tasks():
    """Start background tasks"""
    async def periodic_broadcast():
        while True:
            await broadcast_updates()
            await asyncio.sleep(5)  # Broadcast every 5 seconds
    
    asyncio.create_task(periodic_broadcast())


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
        access_log=True
    )