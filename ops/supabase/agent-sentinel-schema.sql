-- Agent Sentinel Schema Extension
-- Add to existing decision-tracking-schema.sql or run separately

-- ============================================
-- SENTINEL: Security monitoring tables
-- ============================================

-- Baseline metrics for normal behavior
CREATE TABLE IF NOT EXISTS sentinel_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_category TEXT CHECK (metric_category IN ('tool_usage', 'context_growth', 'session_duration', 'error_rate', 'sequence_pattern')),
    mean_value FLOAT,
    std_dev FLOAT,
    min_value FLOAT,
    max_value FLOAT,
    sample_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE,
    window_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sentinel_baselines_metric ON sentinel_baselines(metric_name, metric_category);
CREATE INDEX idx_sentinel_baselines_window ON sentinel_baselines(window_start, window_end);

-- Security alerts
CREATE TABLE IF NOT EXISTS sentinel_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'tool_anomaly', 'context_poisoning', 'prompt_injection', 
        'hallucination_drift', 'behavior_anomaly', 'system_compromise'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    session_id TEXT,
    tool_calls TEXT[], -- Array of tool names involved
    context_sample TEXT, -- Snippet of suspicious context
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    auto_remediated BOOLEAN DEFAULT false,
    remediation_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sentinel_alerts_type ON sentinel_alerts(alert_type);
CREATE INDEX idx_sentinel_alerts_severity ON sentinel_alerts(severity);
CREATE INDEX idx_sentinel_alerts_acknowledged ON sentinel_alerts(acknowledged);
CREATE INDEX idx_sentinel_alerts_session ON sentinel_alerts(session_id);
CREATE INDEX idx_sentinel_alerts_created ON sentinel_alerts(created_at DESC);

-- Tool call sequences for pattern analysis
CREATE TABLE IF NOT EXISTS sentinel_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    sequence_hash TEXT NOT NULL, -- Hash of tool sequence
    tool_sequence TEXT[] NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_anomalous BOOLEAN DEFAULT false,
    anomaly_score FLOAT DEFAULT 0
);

CREATE INDEX idx_sentinel_sequences_hash ON sentinel_sequences(sequence_hash);
CREATE INDEX idx_sentinel_sequences_session ON sentinel_sequences(session_id);

-- Context window checkpoints
CREATE TABLE IF NOT EXISTS sentinel_context_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    checkpoint_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    token_count INTEGER,
    token_delta INTEGER,
    growth_rate FLOAT, -- tokens per minute
    suspicious_patterns TEXT[],
    entropy_score FLOAT
);

CREATE INDEX idx_sentinel_context_session ON sentinel_context_checkpoints(session_id, checkpoint_time);

-- Functions

-- Calculate anomaly score for a sequence
CREATE OR REPLACE FUNCTION calculate_sequence_anomaly(tool_seq TEXT[])
RETURNS FLOAT AS $$
DECLARE
    seq_hash TEXT;
    baseline_count INTEGER;
    total_count INTEGER;
BEGIN
    seq_hash := md5(array_to_string(tool_seq, ','));
    
    SELECT occurrence_count INTO baseline_count
    FROM sentinel_sequences
    WHERE sequence_hash = seq_hash;
    
    SELECT SUM(occurrence_count) INTO total_count
    FROM sentinel_sequences;
    
    IF baseline_count IS NULL THEN
        RETURN 1.0; -- Never seen = highly anomalous
    END IF;
    
    RETURN 1.0 - (baseline_count::FLOAT / GREATEST(total_count, 1));
END;
$$ LANGUAGE plpgsql;

-- Get recent alerts requiring attention
CREATE OR REPLACE FUNCTION get_pending_alerts(
    min_severity TEXT DEFAULT 'medium',
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    id UUID,
    alert_type TEXT,
    severity TEXT,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.alert_type, a.severity, a.title, a.created_at
    FROM sentinel_alerts a
    WHERE a.acknowledged = false
      AND a.severity >= min_severity
      AND a.created_at > NOW() - (hours_back || ' hours')::INTERVAL
    ORDER BY 
        CASE a.severity 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
        END,
        a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update baseline statistics
CREATE OR REPLACE FUNCTION update_baseline(
    p_metric_name TEXT,
    p_category TEXT,
    p_value FLOAT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sentinel_baselines (
        metric_name, metric_category, mean_value, std_dev, 
        min_value, max_value, sample_count, window_start, window_end
    )
    VALUES (
        p_metric_name, p_category, p_value, 0, p_value, p_value, 1, NOW(), NOW()
    )
    ON CONFLICT (metric_name, metric_category) DO UPDATE SET
        mean_value = (sentinel_baselines.mean_value * sentinel_baselines.sample_count + p_value) / (sentinel_baselines.sample_count + 1),
        std_dev = sqrt((sentinel_baselines.std_dev^2 * sentinel_baselines.sample_count + (p_value - sentinel_baselines.mean_value)^2) / (sentinel_baselines.sample_count + 1)),
        min_value = LEAST(sentinel_baselines.min_value, p_value),
        max_value = GREATEST(sentinel_baselines.max_value, p_value),
        sample_count = sentinel_baselines.sample_count + 1,
        window_end = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE sentinel_alerts IS 'Security alerts from agent behavior monitoring';
COMMENT ON TABLE sentinel_baselines IS 'Statistical baselines for normal agent behavior';
COMMENT ON TABLE sentinel_sequences IS 'Tool call sequences for pattern detection';
COMMENT ON TABLE sentinel_context_checkpoints IS 'Context window snapshots for poisoning detection';
