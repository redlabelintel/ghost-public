-- Command Center Dashboard Database Initialization
-- PostgreSQL Schema Setup

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create database user (if not exists)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'dashboard_user') THEN
      
      CREATE ROLE dashboard_user LOGIN PASSWORD 'dashboard_pass';
   END IF;
END
$do$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE dashboard_db TO dashboard_user;
GRANT ALL ON SCHEMA public TO dashboard_user;

-- Set timezone
SET timezone = 'UTC';

-- Create initial data

-- Insert default CEO user
INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_verified) 
VALUES (
    uuid_generate_v4(),
    'ceo@commandcenter.io',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewreL5JkPmV1TKY.', -- password: 'admin123'
    'Chief Executive Officer',
    'ceo',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert default dashboard
WITH ceo_user AS (SELECT id FROM users WHERE email = 'ceo@commandcenter.io' LIMIT 1)
INSERT INTO dashboards (id, name, description, config, is_default, owner_id)
SELECT 
    uuid_generate_v4(),
    'Executive Dashboard',
    'Main operational dashboard for executive oversight',
    '{"theme": "executive", "layout": "grid", "auto_refresh": true}',
    true,
    ceo_user.id
FROM ceo_user
ON CONFLICT DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, name, description, status, progress, start_date, estimated_completion) VALUES
    (uuid_generate_v4(), 'Command Center Dashboard', 'Real-time operational visibility dashboard', 'active', 25, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '21 days'),
    (uuid_generate_v4(), 'Crypto Trading Bot', 'Automated cryptocurrency trading system', 'active', 95, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '5 days'),
    (uuid_generate_v4(), 'Weather Arbitrage System', 'Weather-based trading opportunities', 'active', 78, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- Insert sample alerts
INSERT INTO alerts (id, type, title, description, source, status) VALUES
    (uuid_generate_v4(), 'warning', 'High Session Cost Detected', 'Session a4b58574 cost $45.20 (150% over budget)', 'Cost Monitor', 'active'),
    (uuid_generate_v4(), 'warning', 'Memory Usage at 78%', 'Primary server memory approaching limit', 'System Monitor', 'active'),
    (uuid_generate_v4(), 'info', 'Database Connection Restored', 'Connection pool stabilized after temporary spike', 'Database Monitor', 'resolved'),
    (uuid_generate_v4(), 'info', 'Backup Completed Successfully', 'Daily backup completed - 2.3GB archived', 'Backup Service', 'resolved')
ON CONFLICT DO NOTHING;

-- Insert initial system health records
INSERT INTO system_health (id, component, status, response_time_ms, cpu_usage, memory_usage, error_rate, details) VALUES
    (uuid_generate_v4(), 'api', 'healthy', 145, 65.0, 78.0, 0.08, '{"endpoints": ["dashboard", "metrics", "auth"], "uptime": "99.97%"}'),
    (uuid_generate_v4(), 'database', 'healthy', 23, null, null, 0.0, '{"connections": 20, "slow_queries": 0}'),
    (uuid_generate_v4(), 'redis', 'healthy', 2, null, null, 0.0, '{"connected_clients": 5, "memory_usage": "15MB"}'),
    (uuid_generate_v4(), 'websocket', 'healthy', 12, null, null, 0.0, '{"active_connections": 5, "rooms": 6}')
ON CONFLICT DO NOTHING;

-- Insert sample metrics (last 24 hours)
DO $$
DECLARE
    i INTEGER;
    metric_time TIMESTAMP;
BEGIN
    FOR i IN 0..23 LOOP
        metric_time := NOW() - (i * INTERVAL '1 hour');
        
        -- Session metrics
        INSERT INTO metrics (id, name, value, unit, source, timestamp) VALUES
            (uuid_generate_v4(), 'sessions.active.count', 15 + random() * 15, 'count', 'session_monitor', metric_time),
            (uuid_generate_v4(), 'sessions.cost.total', 20 + random() * 20, 'USD', 'session_monitor', metric_time),
            (uuid_generate_v4(), 'sessions.cost.average', 2.5 + random() * 2, 'USD', 'session_monitor', metric_time);
            
        -- System metrics
        INSERT INTO metrics (id, name, value, unit, source, timestamp) VALUES
            (uuid_generate_v4(), 'system.cpu.usage', 50 + random() * 30, 'percent', 'system_monitor', metric_time),
            (uuid_generate_v4(), 'system.memory.usage', 60 + random() * 25, 'percent', 'system_monitor', metric_time),
            (uuid_generate_v4(), 'system.disk.usage', 40 + random() * 15, 'percent', 'system_monitor', metric_time);
            
        -- API metrics
        INSERT INTO metrics (id, name, value, unit, source, timestamp) VALUES
            (uuid_generate_v4(), 'api.response_time.avg', 100 + random() * 100, 'ms', 'api_monitor', metric_time),
            (uuid_generate_v4(), 'api.response_time.p99', 150 + random() * 150, 'ms', 'api_monitor', metric_time),
            (uuid_generate_v4(), 'api.requests.per_minute', 1000 + random() * 500, 'count', 'api_monitor', metric_time);
    END LOOP;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_name_timestamp_value ON metrics (name, timestamp, value);
CREATE INDEX IF NOT EXISTS idx_alerts_created_status ON alerts (created_at, status);
CREATE INDEX IF NOT EXISTS idx_system_health_component_timestamp ON system_health (component, timestamp);

-- Update table statistics
ANALYZE users, dashboards, widgets, metrics, alerts, projects, sessions, system_health;

-- Show initialization summary
SELECT 
    'Database initialized successfully!' as status,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM dashboards) as dashboards_count,
    (SELECT COUNT(*) FROM projects) as projects_count,
    (SELECT COUNT(*) FROM alerts) as alerts_count,
    (SELECT COUNT(*) FROM metrics) as metrics_count;