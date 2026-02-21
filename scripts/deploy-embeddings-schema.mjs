// Direct PostgreSQL connection test using pg library
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.szxvuhbffimpenkwlfxl.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eHZ1aGJmZmltcGVua3dsZnhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUwMjg2NCwiZXhwIjoyMDg2MDc4ODY0fQ.tKueYbdEVPgk8SaXdQM2Jdq-PVbEEXJMp1liEcAf__c',
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');
    
    // Create extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✅ Vector extension enabled');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ghostmemory_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ ghostmemory_embeddings table created');
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
      ON ghostmemory_embeddings 
      USING ivfflat (embedding vector_cosine_ops)
    `);
    console.log('✅ Vector index created');
    
    // Create search function
    await client.query(`
      CREATE OR REPLACE FUNCTION search_similar_memories(
        query_embedding vector(1536),
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
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ search_similar_memories function created');
    
    console.log('\n🎉 Schema deployment complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTable();
