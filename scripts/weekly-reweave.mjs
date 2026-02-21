#!/usr/bin/env node
/**
 * Weekly Memory Consolidation (/reweave Protocol)
 * 
 * Distills daily notes into long-term MEMORY.md
 * Archives raw notes, preserves decisions, detects patterns
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

const MEMORY_DIR = '/Users/ghost/.openclaw/workspace-ghost/memory';
const ARCHIVE_DIR = path.join(MEMORY_DIR, 'archive');
const OPS_DIR = '/Users/ghost/.openclaw/workspace-ghost/ops/pattern-reports';

async function main() {
  console.log('🔮 Weekly Memory Consolidation — /reweave Protocol\n');

  // Get date range (last 7 days)
  const today = new Date();
  const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
  
  const datePattern = '2026-02-??.md'; // Simplified for current month
  const dailyNotes = await glob(path.join(MEMORY_DIR, datePattern));
  
  console.log(`Found ${dailyNotes.length} daily notes`);

  // Read all daily notes
  const weekData = [];
  for (const file of dailyNotes.sort()) {
    const content = await fs.readFile(file, 'utf8');
    const date = path.basename(file, '.md');
    weekData.push({ date, file, content });
  }

  // Extract components
  const decisions = extractDecisions(weekData);
  const facts = extractFacts(weekData);
  const lessons = extractLessons(weekData);
  const patterns = detectPatterns(weekData);

  // Generate consolidation report
  const report = generateReport({
    weekRange: `${weekData[0]?.date || 'N/A'} to ${weekData[weekData.length - 1]?.date || 'N/A'}`,
    decisions,
    facts,
    lessons,
    patterns,
    stats: {
      totalNotes: weekData.length,
      totalLines: weekData.reduce((sum, d) => sum + d.content.split('\n').length, 0),
      decisionsExtracted: decisions.length,
      patternsDetected: patterns.length
    }
  });

  // Save report
  await fs.mkdir(OPS_DIR, { recursive: true });
  const reportPath = path.join(OPS_DIR, `weekly-consolidation-${today.toISOString().split('T')[0]}.md`);
  await fs.writeFile(reportPath, report);
  console.log(`✅ Report saved: ${reportPath}`);

  // Archive daily notes
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const archiveName = `week-${weekData[0]?.date || 'unknown'}-to-${weekData[weekData.length - 1]?.date || 'unknown'}.md`;
  const archivePath = path.join(ARCHIVE_DIR, archiveName);
  
  const archiveContent = weekData.map(d => 
    `<!-- ${d.date} -->\n${d.content}\n\n---\n`
  ).join('\n');
  
  await fs.writeFile(archivePath, archiveContent);
  console.log(`✅ Archived: ${archivePath}`);

  // Update MEMORY.md (simplified - just append summary)
  const memoryPath = path.join(MEMORY_DIR, 'MEMORY.md');
  const memoryAddendum = `\n\n---\n\n## Weekly Consolidation: ${today.toISOString().split('T')[0]}\n\n### Key Decisions\n${decisions.map(d => `- **${d.title}** — ${d.status}`).join('\n')}\n\n### Patterns Detected\n${patterns.map(p => `- ${p.description}`).join('\n')}\n\n### Actions Taken\n${weekData.length} daily notes consolidated, ${decisions.length} decisions preserved.\n`;
  
  await fs.appendFile(memoryPath, memoryAddendum);
  console.log(`✅ MEMORY.md updated`);

  console.log('\n🎉 Consolidation complete');
  console.log(`   Decisions: ${decisions.length}`);
  console.log(`   Patterns: ${patterns.length}`);
  console.log(`   Notes archived: ${weekData.length}`);
}

function extractDecisions(weekData) {
  const decisions = [];
  for (const { content, date } of weekData) {
    // Match decision patterns
    const decisionMatches = content.matchAll(/\*\*Decision:\*\*\s*(.+?)\n/gi);
    for (const match of decisionMatches) {
      decisions.push({
        title: match[1].trim(),
        date,
        status: 'active'
      });
    }
    
    // Match "Decided to" patterns
    const decidedMatches = content.matchAll(/(?:decided|chose|opted)\s+(?:to|for)\s+(.+?)(?:\n|\.|$)/gi);
    for (const match of decidedMatches) {
      decisions.push({
        title: match[1].trim(),
        date,
        status: 'active'
      });
    }
  }
  return [...new Map(decisions.map(d => [d.title, d])).values()]; // Deduplicate
}

function extractFacts(weekData) {
  const facts = [];
  for (const { content, date } of weekData) {
    // Match "FACT:" patterns
    const factMatches = content.matchAll(/\*\*Fact:\*\*\s*(.+?)\n/gi);
    for (const match of factMatches) {
      facts.push({ content: match[1].trim(), date });
    }
  }
  return facts;
}

function extractLessons(weekData) {
  const lessons = [];
  for (const { content, date } of weekData) {
    // Match "Lesson:" or "Learned:" patterns
    const lessonMatches = content.matchAll(/(?:lesson|learned|takeaway)[\s:]+(.+?)(?:\n|$)/gi);
    for (const match of lessonMatches) {
      lessons.push({ content: match[1].trim(), date });
    }
  }
  return lessons;
}

function detectPatterns(weekData) {
  const patterns = [];
  const allContent = weekData.map(d => d.content.toLowerCase()).join(' ');
  
  // Simple pattern detection
  if (allContent.includes('error') && allContent.includes('fixed')) {
    patterns.push({ 
      type: 'error-resolution',
      description: 'Multiple errors encountered and resolved this week'
    });
  }
  
  if (allContent.includes('skill') && allContent.includes('deployed')) {
    patterns.push({
      type: 'skill-development',
      description: 'Active skill building and deployment'
    });
  }
  
  if (allContent.includes('cost') && allContent.includes('$0')) {
    patterns.push({
      type: 'cost-optimization',
      description: 'Maintained zero-cost operations'
    });
  }
  
  return patterns;
}

function generateReport({ weekRange, decisions, facts, lessons, patterns, stats }) {
  return `# Weekly Memory Consolidation Report

**Week:** ${weekRange}  
**Generated:** ${new Date().toISOString()}

## Summary Statistics

| Metric | Value |
|--------|-------|
| Daily Notes Processed | ${stats.totalNotes} |
| Total Lines | ${stats.totalLines} |
| Decisions Extracted | ${stats.decisionsExtracted} |
| Patterns Detected | ${stats.patternsDetected} |

## Key Decisions Preserved

${decisions.length > 0 
  ? decisions.map(d => `- **${d.title}** (${d.date}) — ${d.status}`).join('\n')
  : '_No explicit decisions found this week_'
}

## Patterns Detected

${patterns.length > 0
  ? patterns.map(p => `- **${p.type}:** ${p.description}`).join('\n')
  : '_No clear patterns detected_'
}

## Facts Archived

${facts.length > 0
  ? facts.map(f => `- ${f.content} (${f.date})`).join('\n')
  : '_No explicit facts recorded_'
}

## Lessons Learned

${lessons.length > 0
  ? lessons.map(l => `- ${l.content} (${l.date})`).join('\n')
  : '_No explicit lessons recorded_'
}

## Consolidation Actions

- [x] Read daily notes (${stats.totalNotes})
- [x] Extract decisions (${stats.decisionsExtracted})
- [x] Detect patterns (${stats.patternsDetected})
- [x] Archive raw notes
- [x] Update MEMORY.md
- [x] Generate pattern report

## Next Steps

1. Review extracted decisions for accuracy
2. Add any missing context to MEMORY.md
3. Flag superseded decisions if applicable
4. Link related decisions in decision graph

---

*Consolidated by /reweave protocol — Ghost*
`;
}

main().catch(err => {
  console.error('❌ Consolidation failed:', err);
  process.exit(1);
});
