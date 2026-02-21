import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://szxvuhbffimpenkwlfxl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eHZ1aGJmZmltcGVua3dsZnhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUwMjg2NCwiZXhwIjoyMDg2MDc4ODY0fQ.tKueYbdEVPgk8SaXdQM2Jdq-PVbEEXJMp1liEcAf__c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deploySchema() {
  console.log('🔧 Deploying vector memory schema via Supabase...\n');
  
  try {
    // Try using pgql function if available
    const { error: rpcError } = await supabase.rpc('pgql', {
      query: 'CREATE EXTENSION IF NOT EXISTS vector'
    });
    
    if (rpcError) {
      console.log('pgql RPC not available, trying alternative...');
    } else {
      console.log('✅ Vector extension enabled');
    }
    
    // Alternative: Use REST API to insert directly if table exists
    // But if schema doesn't exist, we need another approach
    
    // Try exec_sql function if it exists
    const { error: execError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test'
    });
    
    if (execError && execError.message.includes('function') && execError.message.includes('not found')) {
      console.log('⚠️  Custom SQL functions not deployed');
      console.log('⚠️  Supabase REST API blocks DDL operations (correct security behavior)');
      console.log('\n📋 Manual SQL Editor Required:');
      console.log('1. Go to: https://app.supabase.com/project/szxvuhbffimpenkwlfxl/sql');
      console.log('2. Run: ops/supabase/agent-sentinel-schema.sql');
      console.log('3. Then run: node scripts/populate-embeddings.mjs');
    } else if (!execError) {
      // exec_sql exists, use it
      console.log('✅ exec_sql function found, deploying schema...');
      
      const schemaSql = `
        CREATE EXTENSION IF NOT EXISTS vector;
        
        CREATE TABLE IF NOT EXISTS ghostmemory_embeddings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_type TEXT NOT NULL,
          source_id TEXT NOT NULL,
          content TEXT NOT NULL,
          embedding vector(1536),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
        ON ghostmemory_embeddings 
        USING ivfflat (embedding vector_cosine_ops);
        
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
        ) AS $$\n          SELECT 
            e.source_type,
            e.source_id,
            e.content,
            1 - (e.embedding <=> query_embedding) as similarity,
            e.metadata
          FROM ghostmemory_embeddings e
          WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
          ORDER BY e.embedding <=> query_embedding
          LIMIT match_count;
        $$ LANGUAGE plpgsql;
      `;
      
      const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSql });
      
      if (schemaError) {
        console.error('❌ Schema deployment failed:', schemaError.message);
      } else {
        console.log('✅ Schema deployed successfully!');
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

deploySchema();
