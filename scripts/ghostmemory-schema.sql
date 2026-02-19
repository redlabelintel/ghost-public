-- Ghost Memory System Schema
-- All tables prefixed with ghostmemory_ for namespacing
-- Enable pgvector for semantic search

CREATE EXTENSION IF NOT EXISTS vector;

-- Core memories table with vector embeddings
CREATE TABLE IF NOT EXISTS ghostmemory_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('standup', 'decision', 'fact', 'research', 'error')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  confidence VARCHAR(20) CHECK (confidence IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived', 'superseded')),
  file_path TEXT NOT NULL,
  commit_hash TEXT,
  embedding VECTOR(1536), -- For semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date range queries
CREATE INDEX idx_ghostmemory_memories_date ON ghostmemory_memories(date DESC);

-- Index for type filtering
CREATE INDEX idx_ghostmemory_memories_type ON ghostmemory_memories(type);

-- Index for status filtering
CREATE INDEX idx_ghostmemory_memories_status ON ghostmemory_memories(status);

-- GIN index for tags array
CREATE INDEX idx_ghostmemory_memories_tags ON ghostmemory_memories USING GIN(tags);

-- Vector similarity index
CREATE INDEX idx_ghostmemory_memories_embedding ON ghostmemory_memories USING ivfflat (embedding vector_cosine_ops);

-- Error pattern tracking for recursive learning
CREATE TABLE IF NOT EXISTS ghostmemory_error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_hash TEXT UNIQUE NOT NULL, -- Hash of error signature
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT,
  first_seen DATE NOT NULL DEFAULT CURRENT_DATE,
  last_seen DATE NOT NULL DEFAULT CURRENT_DATE,
  occurrence_count INTEGER DEFAULT 1,
  solutions TEXT[] DEFAULT '{}',
  preventive_measures TEXT[] DEFAULT '{}',
  related_memories UUID[] DEFAULT '{}', -- References to ghostmemory_memories
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ghostmemory_error_patterns_hash ON ghostmemory_error_patterns(signature_hash);
CREATE INDEX idx_ghostmemory_error_patterns_type ON ghostmemory_error_patterns(error_type);

-- Decision graph with self-referencing relationships
CREATE TABLE IF NOT EXISTS ghostmemory_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  what TEXT NOT NULL,
  why TEXT NOT NULL,
  grounding UUID[] DEFAULT '{}', -- References to other decisions (parent causes)
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'archived')),
  superseded_by UUID REFERENCES ghostmemory_decisions(id) ON DELETE SET NULL,
  outcome TEXT, -- What actually happened
  lessons_learned TEXT,
  memory_id UUID REFERENCES ghostmemory_memories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ghostmemory_decisions_date ON ghostmemory_decisions(date DESC);
CREATE INDEX idx_ghostmemory_decisions_status ON ghostmemory_decisions(status);

-- Semantic tags auto-extracted from content
CREATE TABLE IF NOT EXISTS ghostmemory_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  frequency INTEGER DEFAULT 1,
  related_tags TEXT[] DEFAULT '{}',
  category VARCHAR(50) CHECK (category IN ('topic', 'tool', 'person', 'status', 'project')),
  first_seen DATE DEFAULT CURRENT_DATE,
  last_seen DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ghostmemory_tags_name ON ghostmemory_tags(name);
CREATE INDEX idx_ghostmemory_tags_category ON ghostmemory_tags(category);

-- Relationships graph (many-to-many between memories)
CREATE TABLE IF NOT EXISTS ghostmemory_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES ghostmemory_memories(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES ghostmemory_memories(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('grounds', 'supersedes', 'relates', 'caused', 'follows')),
  strength FLOAT CHECK (strength >= 0 AND strength <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, target_id, relationship_type)
);

CREATE INDEX idx_ghostmemory_relationships_source ON ghostmemory_relationships(source_id);
CREATE INDEX idx_ghostmemory_relationships_target ON ghostmemory_relationships(target_id);

-- Unanswered questions tracking
CREATE TABLE IF NOT EXISTS ghostmemory_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  context TEXT,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'stale')),
  answer TEXT,
  answered_at TIMESTAMPTZ,
  related_memories UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ghostmemory_questions_status ON ghostmemory_questions(status);
CREATE INDEX idx_ghostmemory_questions_priority ON ghostmemory_questions(priority);

-- Sync tracking
CREATE TABLE IF NOT EXISTS ghostmemory_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  files_processed INTEGER DEFAULT 0,
  memories_created INTEGER DEFAULT 0,
  memories_updated INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  commit_hash TEXT
);

-- Views for common queries

-- Active decisions with full grounding chain
CREATE OR REPLACE VIEW ghostmemory_active_decisions AS
SELECT 
  d.*,
  m.embedding,
  m.tags
FROM ghostmemory_decisions d
LEFT JOIN ghostmemory_memories m ON d.memory_id = m.id
WHERE d.status = 'active';

-- Error patterns requiring attention (3+ occurrences)
CREATE OR REPLACE VIEW ghostmemory_critical_errors AS
SELECT *
FROM ghostmemory_error_patterns
WHERE occurrence_count >= 3 AND status = 'active'
ORDER BY occurrence_count DESC;

-- Recent memories with semantic search ready
CREATE OR REPLACE VIEW ghostmemory_recent_memories AS
SELECT 
  m.*,
  d.outcome,
  d.lessons_learned
FROM ghostmemory_memories m
LEFT JOIN ghostmemory_decisions d ON m.id = d.memory_id
WHERE m.date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY m.date DESC;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION ghostmemory_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER ghostmemory_memories_updated_at
  BEFORE UPDATE ON ghostmemory_memories
  FOR EACH ROW EXECUTE FUNCTION ghostmemory_update_timestamp();

CREATE TRIGGER ghostmemory_error_patterns_updated_at
  BEFORE UPDATE ON ghostmemory_error_patterns
  FOR EACH ROW EXECUTE FUNCTION ghostmemory_update_timestamp();

CREATE TRIGGER ghostmemory_decisions_updated_at
  BEFORE UPDATE ON ghostmemory_decisions
  FOR EACH ROW EXECUTE FUNCTION ghostmemory_update_timestamp();

CREATE TRIGGER ghostmemory_tags_updated_at
  BEFORE UPDATE ON ghostmemory_tags
  FOR EACH ROW EXECUTE FUNCTION ghostmemory_update_timestamp();
