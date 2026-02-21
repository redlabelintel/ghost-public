#!/usr/bin/env node
/**
 * Populate Vector Memory
 * Generate embeddings for all existing memories and store in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const SUPABASE_URL = 'https://szxvuhbffimpenkwlfxl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Need service role key

const MEMORY_DIR = '/Users/ghost/.openclaw/workspace-ghost/memory';

// Simple embedding generation (using local model or OpenAI)
async function generateEmbedding(text) {
  // Option 1: Use OpenAI API (requires key)
  // Option 2: Use local model via LM Studio
  // Option 3: Use OpenClaw's embedding capability
  
  // For now, placeholder - integrate with your preferred method
  console.log(`Generating embedding for ${text.length} chars...`);
  return new Array(1536).fill(0).map(() => Math.random() - 0.5); // Placeholder
}

async function main() {
  console.log('🔮 Populating Vector Memory\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Get all memory files
  const files = await readdir(MEMORY_DIR);
  const memoryFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
  
  console.log(`Found ${memoryFiles.length} memory files`);
  
  let processed = 0;
  let errors = 0;
  
  for (const file of memoryFiles) {
    try {
      const content = await readFile(path.join(MEMORY_DIR, file), 'utf8');
      const date = file.replace('.md', '');
      
      // Extract decisions, facts, lessons
      const chunks = extractChunks(content, date);
      
      for (const chunk of chunks) {
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
              file: file
            }
          });
        
        if (error) {
          console.error(`❌ Error storing ${chunk.id}:`, error);
          errors++;
        } else {
          processed++;
        }
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\n✅ Complete: ${processed} embeddings stored, ${errors} errors`);
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
      content: `Decision: ${match[1].trim()}`
    });
  }
  
  // Extract facts
  const factMatches = content.matchAll(/\*\*Fact:\*\*\s*(.+?)(?:\n|$)/gi);
  for (const match of factMatches) {
    chunks.push({
      id: `${date}-fact-${chunks.length}`,
      date,
      type: 'fact',
      content: `Fact: ${match[1].trim()}`
    });
  }
  
  // Extract lessons
  const lessonMatches = content.matchAll(/(?:lesson|learned|takeaway)[\s:]+(.+?)(?:\n|$)/gi);
  for (const match of lessonMatches) {
    chunks.push({
      id: `${date}-lesson-${chunks.length}`,
      date,
      type: 'lesson',
      content: `Lesson: ${match[1].trim()}`
    });
  }
  
  // If no structured content, store whole file summary
  if (chunks.length === 0) {
    chunks.push({
      id: `${date}-summary`,
      date,
      type: 'summary',
      content: `Memory from ${date}: ${content.substring(0, 1000)}...`
    });
  }
  
  return chunks;
}

main().catch(console.error);
