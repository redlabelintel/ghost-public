#!/usr/bin/env node
/**
 * Ghost Memory System Sync Script
 * Parses markdown memories and syncs to Supabase
 * Run: node scripts/ghostmemory-sync.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://szxvuhbffimpenkwlfxl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const REPO_ROOT = path.join(__dirname, '..');

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse YAML frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  
  const fm = match[1];
  const body = match[2];
  const frontmatter = {};
  
  fm.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key.trim()] = value.slice(1, -1).split(',').map(s => s.trim());
      } else {
        frontmatter[key.trim()] = value;
      }
    }
  });
  
  return { frontmatter, body };
}

// Extract entries from markdown
function extractEntries(filePath, content) {
  const { frontmatter, body } = parseFrontmatter(content);
  const entries = [];
  
  // Split by headers (##)
  const sections = body.split(/^## /m);
  
  sections.forEach((section, idx) => {
    if (!section.trim()) return;
    
    const lines = section.split('\n');
    const title = lines[0].trim();
    const sectionContent = lines.slice(1).join('\n').trim();
    
    // Determine entry type
    let type = frontmatter.type || 'fact';
    if (title.toLowerCase().includes('error') || sectionContent.includes('error')) {
      type = 'error';
    } else if (title.toLowerCase().includes('decision')) {
      type = 'decision';
    }
    
    entries.push({
      date: frontmatter.date || path.basename(filePath, '.md').match(/\d{4}-\d{2}-\d{2}/)?.[0],
      type,
      title: title.replace(/^#+ /, ''),
      content: sectionContent,
      tags: frontmatter.tags || [],
      confidence: frontmatter.confidence || 'medium',
      status: frontmatter.status || 'active',
      file_path: path.relative(REPO_ROOT, filePath),
      source: 'markdown'
    });
  });
  
  return entries;
}

// Generate embedding (placeholder - would call local model or API)
async function generateEmbedding(text) {
  // For now, return null - would integrate with Ollama or OpenAI
  // Example: await ollama.embeddings({ model: 'nomic-embed-text', prompt: text });
  return null;
}

// Sync single file
async function syncFile(filePath, dryRun = false) {
  console.log(`Processing: ${path.basename(filePath)}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = extractEntries(filePath, content);
  
  console.log(`  Found ${entries.length} entries`);
  
  if (dryRun) {
    entries.forEach(e => console.log(`  - [${e.type}] ${e.title.substring(0, 60)}...`));
    return { created: 0, updated: 0, errors: [] };
  }
  
  let created = 0;
  let updated = 0;
  const errors = [];
  
  for (const entry of entries) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('ghostmemory_memories')
        .select('id')
        .eq('file_path', entry.file_path)
        .eq('title', entry.title)
        .single();
      
      // Generate embedding
      const embedding = await generateEmbedding(entry.content);
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('ghostmemory_memories')
          .update({
            ...entry,
            embedding,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
        updated++;
      } else {
        // Create
        const { error } = await supabase
          .from('ghostmemory_memories')
          .insert({
            ...entry,
            embedding,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        created++;
      }
    } catch (err) {
      errors.push({ entry: entry.title, error: err.message });
      console.error(`  Error: ${err.message}`);
    }
  }
  
  return { created, updated, errors };
}

// Main sync function
async function syncAll(options = {}) {
  const dryRun = options.dryRun || false;
  const files = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md') && f !== '.schema.md')
    .map(f => path.join(MEMORY_DIR, f));
  
  console.log(`\n🧠 Ghost Memory System Sync`);
  console.log(`===========================`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Files: ${files.length}`);
  console.log('');
  
  const stats = { created: 0, updated: 0, errors: 0 };
  
  for (const file of files) {
    const result = await syncFile(file, dryRun);
    stats.created += result.created;
    stats.updated += result.updated;
    stats.errors += result.errors.length;
  }
  
  // Log sync operation
  if (!dryRun) {
    await supabase.from('ghostmemory_sync_log').insert({
      started_at: new Date().toISOString(),
      files_processed: files.length,
      memories_created: stats.created,
      memories_updated: stats.updated,
      errors: stats.errors > 0 ? [`${stats.errors} errors`] : [],
      status: stats.errors > 0 ? 'completed_with_errors' : 'completed'
    });
  }
  
  console.log('\n===========================');
  console.log(`Created: ${stats.created}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Errors:  ${stats.errors}`);
  console.log('');
  
  return stats;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  syncAll({ dryRun })
    .then(stats => {
      process.exit(stats.errors > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { syncAll, syncFile, extractEntries };
