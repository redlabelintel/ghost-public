#!/usr/bin/env node
/**
 * Decision Tracking CLI
 * Command-line interface for decision graph
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://szxvuhbffimpenkwlfxl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_secret_xzpVgbbisJVmDMk3S7hnIQ_Ibr2F00r';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const commands = {
  async log(args) {
    const [title, ...rest] = args;
    const description = rest.join(' ');
    
    if (!title) {
      console.error('Usage: decision log "Title" description...');
      process.exit(1);
    }
    
    const decisionId = `DEC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // For now, just log to console (Supabase schema not deployed yet)
    console.log('📝 Decision Logged:');
    console.log(`  ID: ${decisionId}`);
    console.log(`  Title: ${title}`);
    console.log(`  Description: ${description || 'N/A'}`);
    console.log(`  Date: ${new Date().toISOString()}`);
    console.log(`  Status: active`);
    
    console.log('\n⚠️  Note: Supabase schema not deployed yet.');
    console.log('Run decision-tracking-schema.sql in Supabase SQL Editor first.');
  },
  
  async list(args) {
    const status = args[0] || 'active';
    
    console.log(`📋 Decisions (${status}):`);
    console.log('─────────────────────────────────');
    
    // Pre-loaded decisions (from schema)
    const decisions = [
      { id: 'DEC-2026-02-13-001', title: '100% Local Model Switch', status: 'active', date: '2026-02-13' },
      { id: 'DEC-2026-02-18-001', title: 'Multi-Agent to Single Agent', status: 'active', date: '2026-02-18' },
      { id: 'DEC-2026-02-19-001', title: 'Skill Architecture Migration', status: 'active', date: '2026-02-19' },
      { id: 'DEC-2026-02-21-001', title: 'Visual Explainer Integration', status: 'active', date: '2026-02-21' }
    ];
    
    decisions.forEach(d => {
      console.log(`  ${d.id}`);
      console.log(`    Title: ${d.title}`);
      console.log(`    Status: ${d.status}`);
      console.log(`    Date: ${d.date}`);
      console.log('');
    });
    
    console.log('─────────────────────────────────');
    console.log(`Total: ${decisions.length} decisions`);
  },
  
  async lineage(args) {
    const decisionId = args[0];
    
    if (!decisionId) {
      console.error('Usage: decision lineage DEC-XXX-XX-XX-XXX');
      process.exit(1);
    }
    
    console.log(`🔍 Lineage for ${decisionId}:`);
    console.log('─────────────────────────────────');
    console.log('  [Schema not deployed - lineage query would run here]');
    console.log('  Use: SELECT * FROM get_decision_lineage(decision_uuid);');
  },
  
  async help() {
    console.log('Decision Tracking CLI');
    console.log('');
    console.log('Commands:');
    console.log('  decision log "Title" description    Log a new decision');
    console.log('  decision list [status]              List decisions (default: active)');
    console.log('  decision lineage DEC-XXX            Show decision lineage');
    console.log('  decision help                       Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  decision log "Switch to GPT-4" For better reasoning');
    console.log('  decision list superseded');
    console.log('  decision lineage DEC-2026-02-21-001');
  }
};

const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === 'help') {
  commands.help();
} else if (commands[cmd]) {
  commands[cmd](args).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${cmd}`);
  console.error('Run "decision help" for usage');
  process.exit(1);
}
