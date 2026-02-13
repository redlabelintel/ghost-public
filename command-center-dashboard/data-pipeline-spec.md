# Command Center Dashboard - Data Pipeline Specification

**Author:** Aaron (Data Pipeline Engineer)  
**Created:** 2026-02-13  
**Status:** COMPLETE  
**Classification:** Data Engineering Specification v1.0

---

## Executive Summary

Complete data pipeline architecture ensuring operational visibility data reaches the CEO in under 10 seconds with real-time updates.

---

## 1. Data Flow Architecture

### Data Pipeline Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DATA PIPELINE ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATA SOURCES                                     │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │ │
│  │  │  APIs   │ │Databases│ │  Logs   │ │ Metrics │ │ Events  │          │ │
│  │  │(REST/  │ │(SQL/   │ │(Sys/   │ │(Prom/  │ │(Kafka/ │          │ │
│  │  │GraphQL)│ │NoSQL)  │ │App)    │ │Cloud)  │ │Kinesis)│          │ │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │ │
│  └───────┼───────────┼───────────┼───────────┼───────────┼───────────────┘ │
│          │           │           │           │           │                 │
│          └───────────┴───────────┴───────────┴───────────┘                 │
│                              │                                              │
│  ════════════════════════════╪══════════════════════════════════════════  │
│                              │                                              │
│  ┌───────────────────────────▼───────────────────────────┐                 │
│  │              INGESTION LAYER                           │                 │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │                 │
│  │  │  API Gateway │  │ Log Shipper  │  │  CDC Stream  │ │                 │
│  │  │   (Kong)     │  │  (Vector)    │  │ (Debezium)   │ │                 │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │                 │
│  │         └─────────────────┼─────────────────┘          │                 │
│  │                           │                            │                 │
│  │                    ┌──────▼──────┐                     │                 │
│  │                    │ Message Bus │                     │                 │
│  │                    │   (Kafka)   │                     │                 │
│  │                    └──────┬──────┘                     │                 │
│  └───────────────────────────┼───────────────────────────┘                 │
│                              │                                              │
│  ════════════════════════════╪══════════════════════════════════════════  │
│                              │                                              │
│  ┌───────────────────────────▼───────────────────────────┐                 │
│  │              PROCESSING LAYER                          │                 │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │                 │
│  │  │   Stream     │  │    Batch     │  │   ML/AI      │ │                 │
│  │  │ Processing   │  │   Processing │  │   Inference  │ │                 │
│  │  │ (Flink/KS)   │  │   (Spark)    │  │   (Python)   │ │                 │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │                 │
│  │         └─────────────────┼─────────────────┘          │                 │
│  │                           │                            │                 │
│  │                    ┌──────▼──────┐                     │                 │
│  │                    │  Transform  │                     │                 │
│  │                    │   (dbt)     │                     │                 │
│  │                    └──────┬──────┘                     │                 │
│  └───────────────────────────┼───────────────────────────┘                 │
│                              │                                              │
│  ════════════════════════════╪══════════════════════════════════════════  │
│                              │                                              │
│  ┌───────────────────────────▼───────────────────────────┐                 │
│  │              STORAGE LAYER                             │                 │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │                 │
│  │  │  Hot     │ │  Warm    │ │   Cold   │ │ Archive  │ │                 │
│  │  │ (Redis)  │ │(PostgreSQL│ │(S3/Data │ │  (Glacier│ │                 │
│  │  │          │ │/CH)      │ │  Lake)   │ │  )       │ │                 │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │                 │
│  └───────────────────────────────────────────────────────┘                 │
│                              │                                              │
│  ════════════════════════════╪══════════════════════════════════════════  │
│                              │                                              │
│  ┌───────────────────────────▼───────────────────────────┐                 │
│  │              SERVING LAYER                             │                 │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │                 │
│  │  │ REST API │ │ GraphQL  │ │WebSocket │ │  Export  │ │                 │
│  │  │  (Go)    │ │ (Node)   │ │  (Node)  │ │ (Batch)  │ │                 │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │                 │
│  └───────────────────────────────────────────────────────┘                 │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Integration Points

### 2.1 REST API Specification

#### Base URL Structure
```
https://api.commandcenter.io/v1
```

#### Core Endpoints

```yaml
# Dashboard Data Endpoints
/dashboard/overview:
  get:
    summary: Get executive overview
    response_time_sla: 500ms
    caching: 30s
    
/dashboard/metrics:
  get:
    summary: Get all metrics
    parameters:
      - name: timeRange
        in: query
        type: string
        enum: [1h, 24h, 7d, 30d, custom]
      - name: filters
        in: query
        type: object
    response_time_sla: 2s
    
/dashboard/widgets/{widgetId}/data:
  get:
    summary: Get specific widget data
    response_time_sla: 1s
    caching: 60s
```

### 2.2 WebSocket Protocol

```javascript
// Connection Establishment
const socket = io('wss://api.commandcenter.io', {
  auth: { token: jwt_token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000
});

// Room Subscriptions
socket.emit('subscribe', {
  rooms: [
    'dashboard:overview',
    'metrics:realtime',
    'alerts:all'
  ]
});
```

---

## 3. Database Schemas

### 3.1 PostgreSQL Schema

```sql
-- Dashboard Management
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Widget Configuration
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES dashboards(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  position JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Metric Storage
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50),
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  source VARCHAR(100) NOT NULL
);

CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX idx_metrics_name_timestamp ON metrics(name, timestamp);
```

### 3.2 Redis Data Structure

```
# Cache Strategy
Key Naming Convention:
  cache:{entity}:{id}           - Entity cache (60s TTL)
  session:{token}               - Session storage (24h TTL)
  ws:room:{room_id}             - WebSocket room state
  rate_limit:{user_id}:{action} - Rate limiting
  leaderboard:{metric}          - Computed aggregations (30s TTL)
```

---

## 4. Real-time Data Flow

### Stream Processing Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Data Source │ ───► │  Ingestion   │ ───► │   Pub/Sub    │
│              │      │   Service    │      │   (Redis)    │
└──────────────┘      └──────────────┘      └──────┬───────┘
                                                    │
                         ┌──────────────────────────┘
                         │
                    ┌────▼────┐
                    │ WebSocket│
                    │  Server  │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │ Client 1 │     │ Client 2 │     │ Client N │
   └─────────┘     └─────────┘     └─────────┘
```

---

## 5. Data Sources Integration

### Existing System Integration

| Data Source | Integration Method | Update Frequency | Critical Data |
|-------------|-------------------|------------------|---------------|
| **Supabase** | Direct PostgreSQL | Real-time | Todos, System state |
| **OpenClaw Sessions** | API Polling | 1 minute | Session costs, Status |
| **Cron Jobs** | Event stream | Real-time | Job status, Failures |
| **GitHub** | Webhook + API | Real-time | Commits, PRs |
| **Crypto Trading** | Database CDC | Real-time | P&L, Signals |
| **Weather Arbitrage** | API Polling | 2 hours | Opportunities |
| **System Metrics** | Agent collection | 30 seconds | CPU, Memory, Disk |

### Sample Data Flow

```javascript
// Real-time System Status Update
{
  "type": "system.status.update",
  "timestamp": "2026-02-13T10:45:00Z",
  "payload": {
    "sessions": {
      "active": 5,
      "total_cost": 28.45,
      "highest_cost": 15.20
    },
    "cron_jobs": {
      "total": 11,
      "healthy": 11,
      "failed": 0
    },
    "trading_bot": {
      "status": "paper_trading",
      "daily_pnl": +2.34
    }
  }
}
```

---

## 6. Performance Optimization

### Query Optimization Strategy

| Query Type | Strategy | Target Time |
|------------|----------|-------------|
| Dashboard Overview | Pre-aggregated + Cache | <500ms |
| Widget Data | Indexed queries + Cache | <1s |
| Historical Data | ClickHouse + Compression | <2s |
| Real-time Updates | WebSocket + Redis | <100ms |

### Caching Layers

```yaml
Browser Cache:
  - Static assets: 1 year
  - API responses: 60 seconds
  
CDN Cache (CloudFlare):
  - Static assets: 1 year  
  - API responses: 30 seconds
  
Application Cache (Redis):
  - Dashboard data: 60 seconds
  - Widget data: 30 seconds
  - Aggregations: 30 seconds
```

---

## 7. Error Handling & Recovery

### Circuit Breaker Pattern

```javascript
const circuitBreaker = {
  failureThreshold: 5,
  timeout: 60000,
  fallback: () => cachedData,
  onFailure: () => alerting.notify('data_pipeline_failure')
};
```

### Data Quality Monitoring

| Check | Frequency | Action |
|-------|-----------|--------|
| Missing data points | 1 minute | Alert + Backfill |
| Stale data (>5 min) | 30 seconds | Alert + Refresh |
| Schema validation | Real-time | Drop + Log |
| Duplicate detection | 5 minutes | Dedupe + Alert |

---

## 8. Implementation Roadmap

### Phase 1 (Week 1): Foundation
- PostgreSQL schema deployment
- Redis cluster setup
- Basic REST API endpoints
- WebSocket server
- Dashboard overview endpoint

### Phase 2 (Week 2): Real-time
- Event stream processing
- Widget data pipelines
- Real-time updates
- Performance optimization

### Phase 3 (Week 3): Advanced Features
- Historical data aggregation
- ML-based alerting
- Advanced analytics
- Export functionality

### Phase 4 (Week 4): Production
- Performance tuning
- Monitoring setup
- Load testing
- Go-live preparation

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-13  
**Approved By:** Aaron (Data Pipeline Engineer)