-- Ghost Memory System v2.1: Decision Tracking Schema
-- Implements decision graph for tracking choices, outcomes, and dependencies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- DECISIONS: Core decision tracking
-- ============================================

CREATE TABLE IF NOT EXISTS ghostmemory_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id TEXT UNIQUE NOT NULL, -- Human-readable ID (e.g., "DEC-2026-02-21-001")
    
    -- Core content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    context TEXT, -- What led to this decision
    
    -- Categorization
    category TEXT CHECK (category IN (
        'architecture', 'strategy', 'process', 'tooling', 
        'cost', 'security', 'workflow', 'personnel'
    )),
    
    -- Decision status lifecycle
    status TEXT DEFAULT 'active' CHECK (status IN (
        'draft', 'proposed', 'active', 'superseded', 'archived', 'reverted'
    )),
    
    -- Temporal tracking
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    superseded_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Relationships (the graph)
    supersedes_id UUID REFERENCES ghostmemory_decisions(id),
    grounded_in_id UUID REFERENCES ghostmemory_decisions(id),
    
    -- Outcome tracking
    expected_outcome TEXT,
    actual_outcome TEXT,
    outcome_measured_at TIMESTAMP WITH TIME ZONE,
    outcome_success BOOLEAN, -- Did it work as expected?
    
    -- Metadata
    decided_by TEXT DEFAULT 'Ghost',
    confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 10),
    reversibility TEXT CHECK (reversibility IN ('easy', 'medium', 'hard', 'irreversible')),
    
    -- Auto-generated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_decisions_status ON ghostmemory_decisions(status);
CREATE INDEX idx_decisions_category ON ghostmemory_decisions(category);
CREATE INDEX idx_decisions_supersedes ON ghostmemory_decisions(supersedes_id);
CREATE INDEX idx_decisions_grounded_in ON ghostmemory_decisions(grounded_in_id);
CREATE INDEX idx_decisions_temporal ON ghostmemory_decisions(decided_at DESC);

-- Full-text search for decision content
CREATE INDEX idx_decisions_search ON ghostmemory_decisions 
    USING gin(to_tsvector('english', title || ' ' || description || ' ' || COALESCE(context, '')));

-- ============================================
-- DECISION_TAGS: Flexible tagging system
-- ============================================

CREATE TABLE IF NOT EXISTS ghostmemory_decision_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID NOT NULL REFERENCES ghostmemory_decisions(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(decision_id, tag)
);

CREATE INDEX idx_decision_tags_tag ON ghostmemory_decision_tags(tag);
CREATE INDEX idx_decision_tags_decision ON ghostmemory_decision_tags(decision_id);

-- ============================================
-- DECISION_REVISIONS: Track changes to decisions
-- ============================================

CREATE TABLE IF NOT EXISTS ghostmemory_decision_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID NOT NULL REFERENCES ghostmemory_decisions(id) ON DELETE CASCADE,
    revision_type TEXT CHECK (revision_type IN ('amend', 'clarify', 'extend', 'revert')),
    changes JSONB NOT NULL, -- What changed
    reason TEXT NOT NULL, -- Why it changed
    revised_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revised_by TEXT DEFAULT 'Ghost'
);

CREATE INDEX idx_decision_revisions_decision ON ghostmemory_decision_revisions(decision_id);

-- ============================================
-- DECISION_VOTES: For collaborative decisions (future)
-- ============================================

CREATE TABLE IF NOT EXISTS ghostmemory_decision_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID NOT NULL REFERENCES ghostmemory_decisions(id) ON DELETE CASCADE,
    voter TEXT NOT NULL,
    vote TEXT CHECK (vote IN ('approve', 'reject', 'abstain', 'request_changes')),
    rationale TEXT,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(decision_id, voter)
);

-- ============================================
-- VECTOR MEMORY: Semantic search for memories
-- ============================================

CREATE TABLE IF NOT EXISTS ghostmemory_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type TEXT NOT NULL CHECK (source_type IN ('decision', 'memory', 'skill', 'log')),
    source_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_embeddings_source ON ghostmemory_embeddings(source_type, source_id);
CREATE INDEX idx_embeddings_vector ON ghostmemory_embeddings USING ivfflat (embedding vector_cosine_ops);

-- ============================================
-- FUNCTIONS: Useful queries
-- ============================================

-- Get decision lineage (what led to this decision)
CREATE OR REPLACE FUNCTION get_decision_lineage(decision_uuid UUID)
RETURNS TABLE (
    level INT,
    decision_id TEXT,
    title TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    relationship TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE lineage AS (
        -- Base case: the decision itself
        SELECT 
            0 as level,
            d.id,
            d.decision_id,
            d.title,
            d.decided_at,
            'self'::TEXT as relationship
        FROM ghostmemory_decisions d
        WHERE d.id = decision_uuid
        
        UNION ALL
        
        -- Recursive: what this decision is grounded in
        SELECT 
            l.level + 1,
            parent.id,
            parent.decision_id,
            parent.title,
            parent.decided_at,
            'grounds'::TEXT
        FROM lineage l
        JOIN ghostmemory_decisions parent ON parent.id = (
            SELECT grounded_in_id FROM ghostmemory_decisions WHERE id = l.id
        )
        WHERE l.level < 10 -- Prevent infinite loops
    )
    SELECT lineage.level, lineage.decision_id, lineage.title, lineage.decided_at, lineage.relationship
    FROM lineage
    ORDER BY lineage.level;
END;
$$ LANGUAGE plpgsql;

-- Get decisions that superseded another
CREATE OR REPLACE FUNCTION get_decision_evolution(decision_uuid UUID)
RETURNS TABLE (
    sequence INT,
    decision_id TEXT,
    title TEXT,
    status TEXT,
    decided_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE evolution AS (
        -- Start with original decision
        SELECT 
            1 as sequence,
            d.id,
            d.decision_id,
            d.title,
            d.status,
            d.decided_at,
            d.supersedes_id
        FROM ghostmemory_decisions d
        WHERE d.id = decision_uuid
        
        UNION ALL
        
        -- Find what superseded this
        SELECT 
            e.sequence + 1,
            newer.id,
            newer.decision_id,
            newer.title,
            newer.status,
            newer.decided_at,
            newer.supersedes_id
        FROM evolution e
        JOIN ghostmemory_decisions newer ON newer.supersedes_id = e.id
        WHERE e.sequence < 10
    )
    SELECT evolution.sequence, evolution.decision_id, evolution.title, evolution.status, evolution.decided_at
    FROM evolution
    ORDER BY evolution.sequence;
END;
$$ LANGUAGE plpgsql;

-- Semantic search for similar memories
CREATE OR REPLACE FUNCTION search_similar_memories(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    source_type TEXT,
    source_id TEXT,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.source_type,
        e.source_id,
        e.content,
        1 - (e.embedding <=> query_embedding) as similarity,
        e.metadata
    FROM ghostmemory_embeddings e
    WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Auto-update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decisions_updated_at
    BEFORE UPDATE ON ghostmemory_decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS: Common queries
-- ============================================

-- Active decisions with their grounding
CREATE OR REPLACE VIEW ghostmemory_active_decisions AS
SELECT 
    d.*,
    parent.title as grounded_in_title,
    parent.decision_id as grounded_in_decision_id
FROM ghostmemory_decisions d
LEFT JOIN ghostmemory_decisions parent ON d.grounded_in_id = parent.id
WHERE d.status = 'active'
ORDER BY d.decided_at DESC;

-- Decision outcomes pending measurement
CREATE OR REPLACE VIEW ghostmemory_pending_outcomes AS
SELECT *
FROM ghostmemory_decisions
WHERE status = 'active' 
    AND expected_outcome IS NOT NULL 
    AND actual_outcome IS NULL
ORDER BY decided_at;

-- ============================================
-- ROW LEVEL SECURITY (Enable if needed)
-- ============================================

ALTER TABLE ghostmemory_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghostmemory_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (single-user system)
CREATE POLICY allow_all_decisions ON ghostmemory_decisions FOR ALL USING (true);
CREATE POLICY allow_all_embeddings ON ghostmemory_embeddings FOR ALL USING (true);

-- ============================================
-- INITIAL DATA: Populate with known decisions
-- ============================================

INSERT INTO ghostmemory_decisions (
    decision_id, title, description, context, category, status,
    decided_at, expected_outcome, confidence_score, reversibility
) VALUES 
(
    'DEC-2026-02-13-001',
    '100% Local Model Switch',
    'Eliminate all OpenRouter API costs by switching to LM Studio local deployment',
    '$290/day cost crisis, OpenRouter credits exhausted',
    'cost',
    'active',
    '2026-02-13',
    '$0/day operational cost',
    9,
    'medium'
),
(
    'DEC-2026-02-18-001',
    'Multi-Agent to Single Agent',
    'Simplify from 7 specialist agents to Ghost only',
    'User directive: "there is only ghost"',
    'architecture',
    'active',
    '2026-02-18',
    'Reduced complexity, easier maintenance',
    8,
    'easy'
),
(
    'DEC-2026-02-19-001',
    'Skill Architecture Migration',
    'Convert agent capabilities into composable skills',
    '4 CRITICAL bookmark insights converging on skill architecture',
    'architecture',
    'active',
    '2026-02-19',
    'Portable, reusable capabilities',
    9,
    'medium'
),
(
    'DEC-2026-02-21-001',
    'Visual Explainer Integration',
    'Add rich HTML diagram generation for architecture and analysis',
    'Need better visual communication of complex systems',
    'tooling',
    'active',
    '2026-02-21',
    'Self-contained visual reports',
    8,
    'easy'
)
ON CONFLICT (decision_id) DO NOTHING;

-- ============================================
-- DONE
-- ============================================

COMMENT ON TABLE ghostmemory_decisions IS 'Tracks architectural and strategic decisions with full lineage';
COMMENT ON TABLE ghostmemory_embeddings IS 'Vector embeddings for semantic memory search';
