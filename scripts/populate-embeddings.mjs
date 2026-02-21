#!/usr/bin/env node
/**
 * Populate Vector Memory
 * Generate embeddings for all existing memories using OpenAI API
 * 
 * Usage: OPENAI_API_KEY=sk-... node populate-embeddings.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const SUPABASE_URL = 'https://szxvuhbffimpenkwlfxl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MEMORY_DIR = '/Users/ghost/.openclaw/workspace-ghost/memory';

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY required');
  console.error('Usage: OPENAI_API_KEY=sk-... node populate-embeddings.mjs');
  process.exit(1);
}

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY required');
  process.exit(1);
}

// Generate embedding via OpenAI API
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit input size
      encoding_format: 'float'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function main() {
  console.log('🔮 Populating Vector Memory with OpenAI Embeddings\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Verify schema exists
  const { error: schemaError } = await supabase
    .from('ghostmemory_embeddings')
    .select('id')
    .limit(1);
  
  if (schemaError) {
    console.error('❌ Schema not deployed. Run agent-sentinel-schema.sql first.');
    process.exit(1);
  }
  
  // Get all memory files
  const files = await readdir(MEMORY_DIR);
  const memoryFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
  
  console.log(`Found ${memoryFiles.length} memory files`);
  console.log(`Using OpenAI model: text-embedding-3-small (1536 dimensions)\n`);
  
  let processed = 0;
  let errors = 0;
  let skipped = 0;
  
  for (const file of memoryFiles.sort()) {
    try {
      const content = await readFile(path.join(MEMORY_DIR, file), 'utf8');
      const date = file.replace('.md', '');
      
      // Skip if already embedded
      const { data: existing } = await supabase
        .from('ghostmemory_embeddings')
        .select('id')
        .eq('source_id', `${date}-summary`)
        .limit(1);
      
      if (existing && existing.length > 0) {
        console.log(`⏭️  Skipping ${file} (already embedded)`);
        skipped++;
        continue;
      }
      
      // Extract and embed chunks
      const chunks = extractChunks(content, date);
      
      for (const chunk of chunks) {
        try {
          console.log(`  Processing ${chunk.id} (${chunk.content.length} chars)...`);
          
          const embedding = await generateEmbedding(chunk.content);
          
          const { error } = await supabase
            .from('ghostmemory_embeddings')
            .insert({
              source_type: 'memory',
              source_id: chunk.id,
              content: chunk.content,
              embedding: embedding,
              metadata: {
                date: chunk.date,
                type: chunk.type,
                file: file,
                populated_at: new Date().toISOString()
              }
            });
          
          if (error) {
            console.error(`    ❌ Error storing ${chunk.id}:`, error.message);
            errors++;
          } else {
            console.log(`    ✅ Stored (${embedding.length} dimensions)`);
            processed++;
          }
          
          // Rate limit: 100 requests/minute for OpenAI
          await new Promise(r => setTimeout(r, 600));
          
        } catch (err) {
          console.error(`    ❌ Error generating embedding:`, err.message);
          errors++;
        }
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\n🎉 Complete!`);
  console.log(`   Processed: ${processed} embeddings`);
  console.log(`   Skipped: ${skipped} (already existed)`);
  console.log(`   Errors: ${errors}`);
  
  if (processed > 0) {
    console.log(`\n✅ Vector memory now searchable!`);
    console.log(`   Query: SELECT * FROM search_similar_memories(query_embedding, 0.7, 5);`);
  }
}

function extractChunks(content, date) {
  const chunks = [];
  
  // Extract decisions
  const decisionMatches = content.matchAll(/\*\*Decision:\*\*\s*(.+?)(?:\n|$)/gi);
  for (const match of decisionMatches) {
    chunks.push({
      id: `${date}-decision-${chunks.length}`,
      date,
      type: 'decision',
      content: `Decision on ${date}: ${match[1].trim()}`
    });
  }
  
  // Extract facts
  const factMatches = content.matchAll(/\*\*Fact:\*\*\s*(.+?)(?:\n|$)/gi);
  for (const match of factMatches) {
    chunks.push({
      id: `${date}-fact-${chunks.length}`,
      date,
      type: 'fact',
      content: `Fact on ${date}: ${match[1].trim()}`
    });
  }
  
  // Extract lessons
  const lessonMatches = content.matchAll(/(?:lesson|learned|takeaway)[\s:]+(.+?)(?:\n|$)/gi);
  for (const match of lessonMatches) {
    chunks.push({
      id: `${date}-lesson-${chunks.length}`,
      date,
      type: 'lesson',
      content: `Lesson from ${date}: ${match[1].trim()}`
    });
  }
  
  // Summary chunk if no structured content
  if (chunks.length === 0) {
    chunks.push({
      id: `${date}-summary`,
      date,
      type: 'summary',
      content: `Memory from ${date}: ${content.substring(0, 3000)}...`
    });
  }
  
  return chunks;
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
