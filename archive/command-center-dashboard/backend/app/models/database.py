import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, 
    ForeignKey, Index, BigInteger, Numeric
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


def generate_uuid():
    """Generate UUID string"""
    return str(uuid.uuid4())


def utc_now():
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="viewer")  # ceo, coo, manager, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    dashboards = relationship("Dashboard", back_populates="owner", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_role", "role"),
    )


class Dashboard(Base):
    """Dashboard configuration model"""
    __tablename__ = "dashboards"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    config = Column(JSON, nullable=False, default=dict)
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Foreign keys
    owner_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="dashboards")
    widgets = relationship("Widget", back_populates="dashboard", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_dashboards_owner", "owner_id"),
    )


class Widget(Base):
    """Widget configuration model"""
    __tablename__ = "widgets"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    type = Column(String(100), nullable=False)  # status, metric, chart, alert, table
    title = Column(String(255), nullable=False)
    config = Column(JSON, nullable=False, default=dict)
    position = Column(JSON, nullable=False, default=dict)  # {row: int, col: int, width: int, height: int}
    refresh_interval = Column(Integer, nullable=True)  # seconds
    is_enabled = Column(Boolean, default=True, nullable=False)
    
    # Foreign keys
    dashboard_id = Column(UUID, ForeignKey("dashboards.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="widgets")
    
    __table_args__ = (
        Index("idx_widgets_dashboard", "dashboard_id"),
        Index("idx_widgets_type", "type"),
    )


class Metric(Base):
    """Metrics storage model"""
    __tablename__ = "metrics"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    value = Column(Numeric(precision=15, scale=6), nullable=False)
    unit = Column(String(50), nullable=True)
    metadata = Column(JSON, nullable=True, default=dict)
    source = Column(String(100), nullable=False, index=True)
    
    # Timestamp
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    
    __table_args__ = (
        Index("idx_metrics_name_timestamp", "name", "timestamp"),
        Index("idx_metrics_source_timestamp", "source", "timestamp"),
        Index("idx_metrics_timestamp", "timestamp"),
    )


class Alert(Base):
    """Alert model"""
    __tablename__ = "alerts"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    type = Column(String(50), nullable=False, index=True)  # critical, warning, info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    details = Column(JSON, nullable=True, default=dict)
    source = Column(String(100), nullable=False, index=True)
    
    # Status
    status = Column(String(50), default="active", nullable=False, index=True)  # active, acknowledged, resolved
    acknowledged_by = Column(String(255), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    __table_args__ = (
        Index("idx_alerts_type", "type"),
        Index("idx_alerts_status", "status"),
        Index("idx_alerts_source", "source"),
        Index("idx_alerts_created_at", "created_at"),
    )


class Project(Base):
    """Project tracking model"""
    __tablename__ = "projects"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False, index=True)  # active, completed, paused, cancelled
    progress = Column(Integer, default=0, nullable=False)  # 0-100
    
    # Timeline
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    estimated_completion = Column(DateTime, nullable=True)
    
    # Metadata
    metadata = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    __table_args__ = (
        Index("idx_projects_status", "status"),
        Index("idx_projects_name", "name"),
    )


class Session(Base):
    """User session tracking"""
    __tablename__ = "sessions"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    
    # Session details
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timing
    created_at = Column(DateTime, default=utc_now, nullable=False)
    last_activity = Column(DateTime, default=utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    # Cost tracking
    cost_usd = Column(Numeric(precision=10, scale=6), default=0.0, nullable=False)
    api_calls = Column(BigInteger, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    __table_args__ = (
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_session_id", "session_id"),
        Index("idx_sessions_created_at", "created_at"),
        Index("idx_sessions_is_active", "is_active"),
    )


class SystemHealth(Base):
    """System health monitoring"""
    __tablename__ = "system_health"
    
    id = Column(UUID, primary_key=True, default=generate_uuid)
    component = Column(String(100), nullable=False, index=True)  # api, database, redis, etc
    status = Column(String(50), nullable=False, index=True)  # healthy, warning, critical
    
    # Metrics
    response_time_ms = Column(Integer, nullable=True)
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    error_rate = Column(Float, nullable=True)
    
    # Metadata
    details = Column(JSON, nullable=True, default=dict)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    
    __table_args__ = (
        Index("idx_system_health_component", "component"),
        Index("idx_system_health_status", "status"),
        Index("idx_system_health_timestamp", "timestamp"),
    )