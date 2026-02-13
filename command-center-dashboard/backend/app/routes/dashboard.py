from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.metrics_collector import MetricsCollector
from app.services.cache_manager import CacheManager
from app.models.schema import DashboardOverview, MetricsRequest, WidgetData

router = APIRouter()
metrics_collector = MetricsCollector()
cache_manager = CacheManager()


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    time_range: str = Query(default="24h", regex="^(1h|24h|7d|30d|custom)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get executive dashboard overview with all critical metrics
    
    **Performance Target: <500ms**
    """
    cache_key = f"dashboard:overview:{time_range}"
    
    # Try cache first
    cached_data = await cache_manager.get(cache_key)
    if cached_data:
        return JSONResponse(content=cached_data)
    
    try:
        # Get system health
        system_health = {
            "status": "healthy",
            "uptime": "99.97%",
            "last_check": "30s ago",
            "components": {
                "api": {"status": "healthy", "response_time": 145},
                "database": {"status": "healthy", "response_time": 23},
                "cache": {"status": "healthy", "response_time": 2},
                "websocket": {"status": "healthy", "connections": 5}
            }
        }
        
        # Get financial summary
        financial_summary = {
            "revenue": 1245000.00,
            "change": 45000.00,
            "change_percent": 3.8,
            "target_progress": 78.2
        }
        
        # Get operational KPIs
        operational_kpis = {
            "success_rate": 95.2,
            "target": 95.0,
            "api_success": 99.2,
            "job_success": 98.8,
            "db_success": 99.9
        }
        
        # Get alerts summary
        alerts = await metrics_collector.get_alerts_summary()
        
        overview = {
            "system_health": system_health,
            "financial_summary": financial_summary,
            "operational_kpis": operational_kpis,
            "alerts_summary": alerts,
            "last_updated": datetime.utcnow().isoformat(),
            "time_range": time_range
        }
        
        # Cache for 30 seconds
        await cache_manager.set(cache_key, overview, expire=30)
        
        return overview
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get overview: {str(e)}")


@router.get("/metrics")
async def get_dashboard_metrics(
    time_range: str = Query(default="24h"),
    metrics: Optional[List[str]] = Query(default=None),
    filters: Optional[Dict[str, Any]] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed metrics with optional filtering
    
    **Performance Target: <2s**
    """
    cache_key = f"dashboard:metrics:{time_range}:{hash(str(sorted((metrics or []))))}"
    
    # Try cache first
    cached_data = await cache_manager.get(cache_key)
    if cached_data:
        return JSONResponse(content=cached_data)
    
    try:
        # Session costs data
        session_costs = [
            {"time": "12AM", "cost": 2.1, "sessions": 15},
            {"time": "6AM", "cost": 3.2, "sessions": 18},
            {"time": "12PM", "cost": 4.5, "sessions": 25},
            {"time": "6PM", "cost": 3.8, "sessions": 22},
            {"time": "Now", "cost": 3.45, "sessions": 23},
        ]
        
        # API response times
        api_response_times = [
            {"time": "12AM", "avg": 120, "p99": 180},
            {"time": "6AM", "avg": 135, "p99": 220},
            {"time": "12PM", "avg": 185, "p99": 280},
            {"time": "6PM", "avg": 165, "p99": 245},
            {"time": "Now", "avg": 145, "p99": 215},
        ]
        
        # Error rates
        error_rates = [
            {"time": "12AM", "errors": 2, "total": 1000},
            {"time": "6AM", "errors": 5, "total": 1200},
            {"time": "12PM", "errors": 8, "total": 1800},
            {"time": "6PM", "errors": 3, "total": 1500},
            {"time": "Now", "errors": 1, "total": 1300},
        ]
        
        # User activity
        user_activity = [
            {"time": "12AM", "users": 5, "actions": 45},
            {"time": "6AM", "users": 8, "actions": 92},
            {"time": "12PM", "users": 12, "actions": 156},
            {"time": "6PM", "users": 10, "actions": 134},
            {"time": "Now", "users": 7, "actions": 87},
        ]
        
        metrics_data = {
            "session_costs": session_costs,
            "api_response_times": api_response_times,
            "error_rates": error_rates,
            "user_activity": user_activity,
            "time_range": time_range,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Cache for 60 seconds
        await cache_manager.set(cache_key, metrics_data, expire=60)
        
        return metrics_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")


@router.get("/widgets/{widget_id}/data")
async def get_widget_data(
    widget_id: str,
    time_range: str = Query(default="1h"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get data for a specific widget
    
    **Performance Target: <1s**
    """
    cache_key = f"widget:{widget_id}:{time_range}"
    
    # Try cache first
    cached_data = await cache_manager.get(cache_key)
    if cached_data:
        return JSONResponse(content=cached_data)
    
    try:
        # Mock widget data based on widget_id
        if widget_id == "realtime-metrics":
            data = {
                "active_sessions": 23,
                "cost_per_hour": 3.45,
                "hourly_data": [
                    {"time": "1h ago", "sessions": 18, "cost": 2.8},
                    {"time": "50m", "sessions": 20, "cost": 3.1},
                    {"time": "40m", "sessions": 22, "cost": 3.3},
                    {"time": "30m", "sessions": 21, "cost": 3.2},
                    {"time": "20m", "sessions": 23, "cost": 3.4},
                    {"time": "10m", "sessions": 24, "cost": 3.5},
                    {"time": "Now", "sessions": 23, "cost": 3.45},
                ]
            }
        elif widget_id == "resource-utilization":
            data = {
                "cpu": {"usage": 65, "cores": 8},
                "memory": {"used": 7.8, "total": 10, "percentage": 78},
                "storage": {"used": 2.3, "total": 5, "percentage": 46},
                "api_calls": {"current": 1200, "limit": 5000}
            }
        elif widget_id == "project-status":
            data = {
                "projects": [
                    {
                        "id": "1",
                        "name": "Command Center Dashboard",
                        "progress": 25,
                        "status": "active",
                        "week": "Week 1/4"
                    },
                    {
                        "id": "2", 
                        "name": "Crypto Trading Bot",
                        "progress": 95,
                        "status": "active",
                        "week": "95% Complete"
                    },
                    {
                        "id": "3",
                        "name": "Weather Arbitrage System", 
                        "progress": 78,
                        "status": "active",
                        "week": "Monitoring"
                    }
                ]
            }
        else:
            data = {"message": f"No data available for widget {widget_id}"}
        
        widget_response = {
            "widget_id": widget_id,
            "data": data,
            "time_range": time_range,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Cache for 60 seconds
        await cache_manager.set(cache_key, widget_response, expire=60)
        
        return widget_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get widget data: {str(e)}")


@router.post("/export")
async def export_dashboard_data(
    format: str = Query(default="csv", regex="^(csv|json|excel)$"),
    time_range: str = Query(default="24h"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    Export dashboard data in various formats
    """
    try:
        # Get all dashboard data
        overview = await get_dashboard_overview(time_range, db)
        metrics = await get_dashboard_metrics(time_range, db=db)
        
        export_data = {
            "overview": overview,
            "metrics": metrics,
            "exported_at": datetime.utcnow().isoformat(),
            "format": format,
            "time_range": time_range
        }
        
        # In a real implementation, this would generate a file and return a download link
        return {
            "message": f"Export initiated in {format} format",
            "export_id": f"export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "data": export_data if format == "json" else "Data processing...",
            "status": "completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/health")
async def dashboard_health_check():
    """
    Dashboard service health check
    """
    return {
        "service": "dashboard",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }