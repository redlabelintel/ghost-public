#!/usr/bin/env node
/**
 * Ghost Memory System Query Interface
 * Search, patterns, and analytics on memories
 * Run: node scripts/ghostmemory-query.js [command] [options]
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://szxvuhbffimpenkwlfxl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Semantic search (text-based for now, vector later)
async function search(query, options = {}) {
  console.log(`\n🔍 Searching: "${query}"`);
  console.log('===========================\n');
  
  let q = supabase
    .from('ghostmemory_memories')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('date', { ascending: false });
  
  if (options.type) {
    q = q.eq('type', options.type);
  }
  
  if (options.limit) {
    q = q.limit(options.limit);
  } else {
    q = q.limit(10);
  }
  
  const { data, error } = await q;
  
  if (error) {
    console.error('Query error:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No results found.');
    return;
  }
  
  data.forEach((row, i) => {
    console.log(`${i + 1}. [${row.type.toUpperCase()}] ${row.title}`);
    console.log(`   Date: ${row.date} | Confidence: ${row.confidence} | Status: ${row.status}`);
    console.log(`   File: ${row.file_path}`);
    console.log(`   ${row.content.substring(0, 150)}...\n`);
  });
  
  console.log(`Found ${data.length} results`);
}

// Find error patterns
async function patterns(minOccurrences = 3) {
  console.log(`\n🐛 Error Patterns (≥${minOccurrences} occurrences)`);
  console.log('===========================\n');
  
  const { data, error } = await supabase
    .from('ghostmemory_error_patterns')
    .select('*')
    .gte('occurrence_count', minOccurrences)
    .eq('status', 'active')
    .order('occurrence_count', { ascending: false });
  
  if (error) {
    console.error('Query error:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No recurring errors found.');
    return;
  }
  
  data.forEach((row, i) => {
    console.log(`${i + 1}. ${row.error_type}`);
    console.log(`   Occurrences: ${row.occurrence_count}`);
    console.log(`   First seen: ${row.first_seen} | Last seen: ${row.last_seen}`);
    if (row.solutions?.length) {
      console.log(`   Solutions: ${row.solutions.join(', ')}`);
    }
    if (row.preventive_measures?.length) {
      console.log(`   Prevention: ${row.preventive_measures.join(', ')}`);
    }
    console.log('');
  });
}

// Timeline view
async function timeline(tag, days = 30) {
  console.log(`\n📅 Timeline: ${tag || 'All memories'} (last ${days} days)`);
  console.log('===========================\n');
  
  let q = supabase
    .from('ghostmemory_memories')
    .select('*')
    .gte('date', new Date(Date.now() - days * 86400000).toISOString().split('T')[0])
    .order('date', { ascending: false });
  
  if (tag) {
    q = q.contains('tags', [tag]);
  }
  
  const { data, error } = await q;
  
  if (error) {
    console.error('Query error:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No memories found in this timeframe.');
    return;
  }
  
  // Group by date
  const byDate = {};
  data.forEach(row => {
    if (!byDate[row.date]) byDate[row.date] = [];
    byDate[row.date].push(row);
  });
  
  Object.entries(byDate).forEach(([date, entries]) => {
    console.log(`${date}:`);
    entries.forEach(e => {
      console.log(`  [${e.type}] ${e.title}`);
    });
    console.log('');
  });
  
  console.log(`Total: ${data.length} memories across ${Object.keys(byDate).length} days`);
}

// Gaps - unanswered questions
async function gaps() {
  console.log('\n❓ Unanswered Questions');
  console.log('===========================\n');
  
  const { data, error } = await supabase
    .from('ghostmemory_questions')
    .select('*')
    .eq('status', 'open')
    .order('priority', { ascending: true });
  
  if (error) {
    console.error('Query error:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No open questions. (Create some with: question add "...")');
    return;
  }
  
  data.forEach((row, i) => {
    console.log(`${i + 1}. [P${row.priority}] ${row.question}`);
    if (row.context) {
      console.log(`   Context: ${row.context}`);
    }
    console.log(`   Created: ${row.created_at}`);
    console.log('');
  });
}

// Decision chain (what led to this?)
async function chain(decisionId) {
  console.log(`\n🔗 Decision Chain: ${decisionId}`);
  console.log('===========================\n');
  
  // Get decision with grounding
  const { data: decision, error } = await supabase
    .from('ghostmemory_decisions')
    .select('*')
    .eq('id', decisionId)
    .single();
  
  if (error || !decision) {
    console.error('Decision not found');
    return;
  }
  
  console.log(`Decision: ${decision.title}`);
  console.log(`Date: ${decision.date}`);
  console.log(`What: ${decision.what}`);
  console.log(`Why: ${decision.why}`);
  
  if (decision.grounding?.length) {
    console.log('\nGrounding (what led to this):');
    
    const { data: grounds } = await supabase
      .from('ghostmemory_decisions')
      .select('title, date')
      .in('id', decision.grounding);
    
    grounds?.forEach(g => {
      console.log(`  ↳ ${g.date}: ${g.title}`);
    });
  }
  
  // Find what this decision grounds
  const { data: dependents } = await supabase
    .from('ghostmemory_decisions')
    .select('title, date')
    .contains('grounding', [decisionId]);
  
  if (dependents?.length) {
    console.log('\nLed to:');
    dependents.forEach(d => {
      console.log(`  → ${d.date}: ${d.title}`);
    });
  }
}

// Stats overview
async function stats() {
  console.log('\n📊 Memory System Statistics');
  console.log('===========================\n');
  
  const queries = [
    { name: 'Total memories', table: 'ghostmemory_memories' },
    { name: 'Decisions', table: 'ghostmemory_decisions' },
    { name: 'Error patterns', table: 'ghostmemory_error_patterns' },
    { name: 'Open questions', table: 'ghostmemory_questions', filter: { status: 'open' } },
    { name: 'Tags', table: 'ghostmemory_tags' }
  ];
  
  for (const q of queries) {
    let query = supabase.from(q.table).select('*', { count: 'exact', head: true });
    
    if (q.filter) {
      Object.entries(q.filter).forEach(([k, v]) => {
        query = query.eq(k, v);
      });
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.log(`${q.name}: Error`);
    } else {
      console.log(`${q.name}: ${count || 0}`);
    }
  }
  
  // Recent sync
  const { data: lastSync } = await supabase
    .from('ghostmemory_sync_log')
    .select('*')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();
  
  if (lastSync) {
    console.log(`\nLast sync: ${lastSync.completed_at || lastSync.started_at}`);
    console.log(`Files processed: ${lastSync.files_processed || 0}`);
    console.log(`Created: ${lastSync.memories_created || 0}`);
    console.log(`Updated: ${lastSync.memories_updated || 0}`);
  }
}

// CLI
async function main() {
  const [command, ...args] = process.argv.slice(2);
  
  switch (command) {
    case 'search':
      await search(args.join(' '), { limit: 10 });
      break;
      
    case 'patterns':
      await patterns(parseInt(args[0]) || 3);
      break;
      
    case 'timeline':
      await timeline(args[0], parseInt(args[1]) || 30);
      break;
      
    case 'gaps':
      await gaps();
      break;
      
    case 'chain':
      await chain(args[0]);
      break;
      
    case 'stats':
      await stats();
      break;
      
    default:
      console.log(`
🧠 Ghost Memory Query Interface

Usage:
  node scripts/ghostmemory-query.js [command] [options]

Commands:
  search "query" [type]      Full-text search across memories
  patterns [min-count]       Show recurring errors (default: 3+)
  timeline [tag] [days]      Chronological view (default: 30 days)
  gaps                       Unanswered questions
  chain <decision-id>        Trace decision grounding
  stats                      System overview

Examples:
  node scripts/ghostmemory-query.js search "Cursor Figma"
  node scripts/ghostmemory-query.js patterns 5
  node scripts/ghostmemory-query.js timeline cost 7
  node scripts/ghostmemory-query.js stats
`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  search,
  patterns,
  timeline,
  gaps,
  chain,
  stats
};
