import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import psutil
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, cache_manager
from app.models.database import Metric, Alert, Project, Session, SystemHealth
from app.config import settings

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collect metrics from various sources"""
    
    def __init__(self):
        self.is_running = False
        self.collection_task = None
        self.last_collection = None
        
    async def start(self):
        """Start metrics collection"""
        if self.is_running:
            return
            
        self.is_running = True
        self.collection_task = asyncio.create_task(self._collection_loop())
        logger.info("Metrics collector started")
    
    async def stop(self):
        """Stop metrics collection"""
        self.is_running = False
        if self.collection_task:
            self.collection_task.cancel()
            try:
                await self.collection_task
            except asyncio.CancelledError:
                pass
        logger.info("Metrics collector stopped")
    
    async def _collection_loop(self):
        """Main collection loop"""
        while self.is_running:
            try:
                await self.collect_all_metrics()
                self.last_collection = datetime.utcnow()
                await asyncio.sleep(settings.METRICS_COLLECTION_INTERVAL)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in metrics collection: {e}")
                await asyncio.sleep(10)  # Wait before retrying
    
    async def collect_all_metrics(self):
        """Collect all available metrics"""
        tasks = [
            self.collect_system_metrics(),
            self.collect_session_metrics(),
            self.collect_api_metrics(),
            self.collect_database_metrics(),
            self.update_system_health()
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def collect_system_metrics(self):
        """Collect system resource metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            await self._store_metric("system.cpu.usage", cpu_percent, "percent", "system_monitor")
            
            # Memory usage
            memory = psutil.virtual_memory()
            await self._store_metric("system.memory.usage", memory.percent, "percent", "system_monitor")
            await self._store_metric("system.memory.used", memory.used / 1024**3, "GB", "system_monitor")
            await self._store_metric("system.memory.available", memory.available / 1024**3, "GB", "system_monitor")
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            await self._store_metric("system.disk.usage", disk_percent, "percent", "system_monitor")
            await self._store_metric("system.disk.used", disk.used / 1024**3, "GB", "system_monitor")
            await self._store_metric("system.disk.free", disk.free / 1024**3, "GB", "system_monitor")
            
            # Network I/O
            network = psutil.net_io_counters()
            await self._store_metric("system.network.bytes_sent", network.bytes_sent, "bytes", "system_monitor")
            await self._store_metric("system.network.bytes_recv", network.bytes_recv, "bytes", "system_monitor")
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
    
    async def collect_session_metrics(self):
        """Collect session-related metrics"""
        try:
            # This would typically query your session database
            # For demo purposes, we'll use mock data
            active_sessions = 23
            total_cost = 28.45
            avg_cost_per_session = total_cost / active_sessions if active_sessions > 0 else 0
            
            await self._store_metric("sessions.active.count", active_sessions, "count", "session_monitor")
            await self._store_metric("sessions.cost.total", total_cost, "USD", "session_monitor")
            await self._store_metric("sessions.cost.average", avg_cost_per_session, "USD", "session_monitor")
            
        except Exception as e:
            logger.error(f"Error collecting session metrics: {e}")
    
    async def collect_api_metrics(self):
        """Collect API performance metrics"""
        try:
            # Mock API metrics - in real implementation, this would measure actual API calls
            response_times = [120, 135, 185, 165, 145]  # milliseconds
            avg_response_time = sum(response_times) / len(response_times)
            
            await self._store_metric("api.response_time.avg", avg_response_time, "ms", "api_monitor")
            await self._store_metric("api.response_time.p99", max(response_times), "ms", "api_monitor")
            await self._store_metric("api.requests.per_minute", 1200, "count", "api_monitor")
            await self._store_metric("api.errors.count", 1, "count", "api_monitor")
            await self._store_metric("api.errors.rate", 0.08, "percent", "api_monitor")
            
        except Exception as e:
            logger.error(f"Error collecting API metrics: {e}")
    
    async def collect_database_metrics(self):
        """Collect database performance metrics"""
        try:
            # Mock database metrics
            await self._store_metric("database.connections.active", 15, "count", "db_monitor")
            await self._store_metric("database.connections.idle", 5, "count", "db_monitor")
            await self._store_metric("database.query_time.avg", 23, "ms", "db_monitor")
            await self._store_metric("database.slow_queries.count", 0, "count", "db_monitor")
            
        except Exception as e:
            logger.error(f"Error collecting database metrics: {e}")
    
    async def update_system_health(self):
        """Update overall system health status"""
        try:
            # Determine health status based on metrics
            cpu_usage = await self._get_latest_metric("system.cpu.usage")
            memory_usage = await self._get_latest_metric("system.memory.usage")
            api_errors = await self._get_latest_metric("api.errors.rate")
            
            # Simple health logic
            status = "healthy"
            if cpu_usage and cpu_usage > 90:
                status = "critical"
            elif memory_usage and memory_usage > 85:
                status = "warning"
            elif api_errors and api_errors > 1.0:
                status = "warning"
            
            # Cache system health
            health_data = {
                "status": status,
                "cpu_usage": cpu_usage,
                "memory_usage": memory_usage,
                "api_errors": api_errors,
                "uptime": "99.97%",
                "last_check": datetime.utcnow().isoformat()
            }
            
            await cache_manager.set("system:health", health_data, expire=60)
            
        except Exception as e:
            logger.error(f"Error updating system health: {e}")
    
    async def _store_metric(self, name: str, value: float, unit: str, source: str, metadata: dict = None):
        """Store a metric in the database"""
        try:
            async for db in get_db():
                metric = Metric(
                    name=name,
                    value=value,
                    unit=unit,
                    source=source,
                    metadata=metadata or {},
                    timestamp=datetime.utcnow()
                )
                db.add(metric)
                await db.commit()
                break
        except Exception as e:
            logger.error(f"Error storing metric {name}: {e}")
    
    async def _get_latest_metric(self, name: str) -> Optional[float]:
        """Get the latest value for a metric"""
        try:
            async for db in get_db():
                from sqlalchemy import select, desc
                query = select(Metric.value).where(
                    Metric.name == name
                ).order_by(desc(Metric.timestamp)).limit(1)
                
                result = await db.execute(query)
                row = result.fetchone()
                return row[0] if row else None
        except Exception as e:
            logger.error(f"Error getting metric {name}: {e}")
            return None
    
    async def get_executive_overview(self) -> Dict[str, Any]:
        """Get data for executive overview"""
        health_data = await cache_manager.get("system:health")
        if not health_data:
            health_data = {
                "status": "healthy",
                "uptime": "99.97%",
                "last_check": "30s ago"
            }
        
        return {
            "health": health_data,
            "financial": {
                "revenue": 1245000,
                "change": 45000,
                "changePercent": 3.8
            },
            "kpis": {
                "successRate": 95.2,
                "target": 95.0
            },
            "alerts": {
                "critical": 0,
                "warning": 2,
                "total": 2
            }
        }
    
    async def get_realtime_metrics(self) -> Dict[str, Any]:
        """Get real-time metrics data"""
        active_sessions = await self._get_latest_metric("sessions.active.count") or 23
        cost_per_hour = await self._get_latest_metric("sessions.cost.average") or 3.45
        
        return {
            "activeSessions": int(active_sessions),
            "costPerHour": round(cost_per_hour, 2),
            "hourlyData": [
                {"time": "1h ago", "sessions": 18, "cost": 2.8},
                {"time": "50m", "sessions": 20, "cost": 3.1},
                {"time": "40m", "sessions": 22, "cost": 3.3},
                {"time": "30m", "sessions": 21, "cost": 3.2},
                {"time": "20m", "sessions": 23, "cost": 3.4},
                {"time": "10m", "sessions": 24, "cost": 3.5},
                {"time": "Now", "sessions": int(active_sessions), "cost": cost_per_hour},
            ]
        }
    
    async def get_project_status(self) -> Dict[str, Any]:
        """Get project status data"""
        return {
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
    
    async def get_resource_utilization(self) -> Dict[str, Any]:
        """Get resource utilization data"""
        cpu_usage = await self._get_latest_metric("system.cpu.usage") or 65
        memory_usage = await self._get_latest_metric("system.memory.usage") or 78
        
        return {
            "resources": {
                "cpu": {"usage": int(cpu_usage), "cores": 8},
                "memory": {"used": 7.8, "total": 10, "percentage": int(memory_usage)},
                "storage": {"used": 2.3, "total": 5, "percentage": 46},
                "apiCalls": {"current": 1200, "limit": 5000}
            }
        }
    
    async def get_active_alerts(self) -> Dict[str, Any]:
        """Get active alerts data"""
        return {
            "alerts": [
                {
                    "id": "1",
                    "type": "warning",
                    "title": "High Session Cost Detected",
                    "description": "Session a4b58574 cost $45.20 (150% over budget)",
                    "timestamp": "5 min ago",
                    "source": "Cost Monitor",
                    "acknowledged": False
                },
                {
                    "id": "2",
                    "type": "warning", 
                    "title": "Memory Usage at 78%",
                    "description": "Primary server memory approaching limit",
                    "timestamp": "12 min ago",
                    "source": "System Monitor",
                    "acknowledged": False
                }
            ]
        }
    
    async def get_alerts_summary(self) -> Dict[str, int]:
        """Get alerts summary"""
        return {
            "critical": 0,
            "warning": 2,
            "total": 2
        }
    
    def get_current_timestamp(self) -> str:
        """Get current timestamp"""
        return datetime.utcnow().isoformat()
    
    async def health_check(self) -> Dict[str, Any]:
        """Metrics collector health check"""
        return {
            "status": "healthy" if self.is_running else "stopped",
            "last_collection": self.last_collection.isoformat() if self.last_collection else None,
            "collection_interval": settings.METRICS_COLLECTION_INTERVAL,
            "timestamp": datetime.utcnow().isoformat()
        }