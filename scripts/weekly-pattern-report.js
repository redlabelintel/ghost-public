#!/usr/bin/env node
/**
 * Weekly Pattern Report Generator
 * Scans memory files, extracts patterns, generates insights
 * Phase 3 Intelligence Layer - Ghost Memory System v2.0
 * 
 * Run: node weekly-pattern-report.js [--dry-run]
 * Cron: Sundays 6 PM (before evening reflection)
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const REPORTS_DIR = path.join(__dirname, '..', 'ops', 'pattern-reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Get last 7 days of memory files
function getRecentMemories(days = 7) {
  const files = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const filePath = path.join(MEMORY_DIR, `${dateStr}.md`);
    
    if (fs.existsSync(filePath)) {
      files.push({
        date: dateStr,
        path: filePath,
        content: fs.readFileSync(filePath, 'utf8')
      });
    }
  }
  
  return files;
}

// Extract patterns from memory content
function extractPatterns(memories) {
  const patterns = {
    topics: {},
    decisions: [],
    failures: [],
    wins: [],
    recurringThemes: [],
    moodTrends: [],
    actionItems: { completed: 0, pending: 0 }
  };
  
  const allText = memories.map(m => m.content).join('\n\n');
  
  // Topic extraction (simple keyword matching)
  const topicKeywords = {
    'AI/LLM': /\b(ai|llm|claude|gpt|model|openclaw|agent)\b/gi,
    'Revenue/Business': /\b(revenue|business|stripe|customer|product|launch|sale|\$)\b/gi,
    'Infrastructure': /\b(server|hosting|deploy|infrastructure|api|database)\b/gi,
    'Memory/System': /\b(memory|remember|context|session|storage)\b/gi,
    'Code/Dev': /\b(code|script|function|bug|fix|commit|github)\b/gi,
    'Analysis/Research': /\b(analysis|research|bookmark|study|report)\b/gi
  };
  
  for (const [topic, regex] of Object.entries(topicKeywords)) {
    const matches = allText.match(regex);
    if (matches) {
      patterns.topics[topic] = matches.length;
    }
  }
  
  // Decision extraction (lines with "decision", "chose", "opted for")
  const decisionRegex = /(?:decision|decided|chose|opted for|chose to|will|going to)[\s:]*(.*?)(?:\n|\.\s)/gi;
  let match;
  while ((match = decisionRegex.exec(allText)) !== null) {
    patterns.decisions.push({
      text: match[1].trim().substring(0, 100),
      date: findDateForMatch(memories, match.index, allText)
    });
  }
  
  // Failure/error extraction
  const failureRegex = /(?:failed|failure|error|broke|didn't work|issue|problem)[\s:]*(.*?)(?:\n|\.\s)/gi;
  while ((match = failureRegex.exec(allText)) !== null) {
    patterns.failures.push({
      text: match[1].trim().substring(0, 100),
      date: findDateForMatch(memories, match.index, allText)
    });
  }
  
  // Win/success extraction
  const winRegex = /(?:success|completed|working|operational|deployed|fixed|achieved|done)[\s:]*(.*?)(?:\n|\.\s)/gi;
  while ((match = winRegex.exec(allText)) !== null) {
    patterns.wins.push({
      text: match[1].trim().substring(0, 100),
      date: findDateForMatch(memories, match.index, allText)
    });
  }
  
  // Action items count (checkboxes)
  const completedItems = (allText.match(/- \[x\]/gi) || []).length;
  const pendingItems = (allText.match(/- \[ \]/gi) || []).length;
  patterns.actionItems = { completed: completedItems, pending: pendingItems };
  
  // Recurring themes (topics that appear across multiple days)
  const dailyTopics = memories.map(m => {
    const dayTopics = [];
    for (const [topic, regex] of Object.entries(topicKeywords)) {
      if (regex.test(m.content)) dayTopics.push(topic);
    }
    return { date: m.date, topics: dayTopics };
  });
  
  const topicFrequency = {};
  dailyTopics.forEach(day => {
    day.topics.forEach(topic => {
      topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
    });
  });
  
  patterns.recurringThemes = Object.entries(topicFrequency)
    .filter(([_, count]) => count >= 3)
    .map(([topic, count]) => ({ topic, days: count }));
  
  return patterns;
}

// Helper to find which date a match belongs to
function findDateForMatch(memories, matchIndex, allText) {
  let currentIndex = 0;
  for (const memory of memories) {
    const contentLength = memory.content.length + 2; // +2 for separators
    if (currentIndex + contentLength > matchIndex) {
      return memory.date;
    }
    currentIndex += contentLength;
  }
  return 'unknown';
}

// Generate insights from patterns
function generateInsights(patterns) {
  const insights = [];
  
  // Top topic insight
  const topTopics = Object.entries(patterns.topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topTopics.length > 0) {
    insights.push(`**Primary Focus:** ${topTopics.map(t => t[0]).join(', ')} dominated this week's attention.`);
  }
  
  // Recurring themes insight
  if (patterns.recurringThemes.length > 0) {
    const themes = patterns.recurringThemes.map(t => `${t.topic} (${t.days} days)`).join(', ');
    insights.push(`**Consistent Themes:** ${themes} appeared consistently across the week.`);
  }
  
  // Decision velocity
  if (patterns.decisions.length > 0) {
    insights.push(`**Decision Velocity:** ${patterns.decisions.length} major decisions recorded. ${patterns.decisions.length > 5 ? 'High decision rate — watch for decision fatigue.' : 'Steady decision-making pace.'}`);
  }
  
  // Failure pattern
  if (patterns.failures.length > patterns.wins.length) {
    insights.push(`⚠️ **Warning:** More failures (${patterns.failures.length}) than wins (${patterns.wins.length}) recorded. Review for systemic issues.`);
  } else if (patterns.wins.length > 0) {
    insights.push(`✅ **Momentum:** ${patterns.wins.length} wins vs ${patterns.failures.length} failures — positive week.`);
  }
  
  // Action item completion rate
  const totalItems = patterns.actionItems.completed + patterns.actionItems.pending;
  if (totalItems > 0) {
    const completionRate = Math.round((patterns.actionItems.completed / totalItems) * 100);
    insights.push(`**Execution Rate:** ${completionRate}% of action items completed (${patterns.actionItems.completed}/${totalItems}).`);
  }
  
  return insights;
}

// Generate the report
function generateReport(memories, patterns, insights) {
  const weekStart = memories[memories.length - 1]?.date || 'Unknown';
  const weekEnd = memories[0]?.date || 'Unknown';
  
  const report = `# Weekly Pattern Report

**Period:** ${weekStart} → ${weekEnd}  
**Generated:** ${new Date().toISOString().split('T')[0]}  
**Memory Files Analyzed:** ${memories.length}

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Days Analyzed | ${memories.length} |
| Decisions Made | ${patterns.decisions.length} |
| Wins Recorded | ${patterns.wins.length} |
| Failures/Issues | ${patterns.failures.length} |
| Action Items Completed | ${patterns.actionItems.completed} |
| Action Items Pending | ${patterns.actionItems.pending} |

---

## 🎯 Top Topics This Week

${Object.entries(patterns.topics)
  .sort((a, b) => b[1] - a[1])
  .map(([topic, count]) => `- **${topic}:** ${count} mentions`)
  .join('\n') || '*No dominant topics detected*'}

---

## 💡 Insights

${insights.map(i => `- ${i}`).join('\n') || '*Insufficient data for insights*'}

---

## 🔁 Recurring Themes

${patterns.recurringThemes.length > 0 
  ? patterns.recurringThemes.map(t => `- **${t.topic}:** Active ${t.days} out of ${memories.length} days`).join('\n')
  : '*No clear recurring themes this week*'}

---

## ✅ Key Wins

${patterns.wins.length > 0 
  ? patterns.wins.slice(0, 5).map(w => `- **${w.date}:** ${w.text}`).join('\n')
  : '*No major wins recorded*'}

---

## ⚠️ Issues & Failures

${patterns.failures.length > 0 
  ? patterns.failures.slice(0, 5).map(f => `- **${f.date}:** ${f.text}`).join('\n')
  : '*No major failures recorded*'}

---

## 📝 Recent Decisions

${patterns.decisions.length > 0 
  ? patterns.decisions.slice(0, 5).map(d => `- **${d.date}:** ${d.text}`).join('\n')
  : '*No decisions recorded*'}

---

## 🎯 Recommendations

Based on this week's patterns:

${generateRecommendations(patterns)}

---

*Report generated by Ghost Pattern Detection System*  
*Phase 3 Intelligence Layer | Memory System v2.0*
`;
  
  return report;
}

// Generate recommendations based on patterns
function generateRecommendations(patterns) {
  const recs = [];
  
  if (patterns.actionItems.pending > patterns.actionItems.completed) {
    recs.push('- **Execution Gap:** More pending than completed items. Consider reducing WIP or focusing on completion before starting new work.');
  }
  
  if (patterns.failures.length > 3) {
    recs.push('- **Failure Pattern:** Multiple failures detected. Schedule a "post-mortem" review to identify root causes.');
  }
  
  if (patterns.decisions.length === 0) {
    recs.push('- **Decision Stagnation:** No decisions recorded this week. Consider if you\'re avoiding commitment on key issues.');
  }
  
  if (patterns.recurringThemes.length === 0) {
    recs.push('- **Scattered Focus:** No recurring themes detected. Consider if attention is too fragmented across unrelated topics.');
  }
  
  if (patterns.wins.length > patterns.failures.length * 2) {
    recs.push('- **Strong Momentum:** Excellent win rate. Document what\'s working and consider scaling those patterns.');
  }
  
  if (recs.length === 0) {
    recs.push('- **Stable Week:** No major red flags or obvious optimizations. Continue current trajectory.');
  }
  
  return recs.join('\n');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('📊 Weekly Pattern Report Generator');
  console.log('==================================\n');
  
  // Get recent memories
  const memories = getRecentMemories(7);
  console.log(`Found ${memories.length} memory files from last 7 days`);
  
  if (memories.length === 0) {
    console.log('❌ No memory files found. Cannot generate report.');
    process.exit(1);
  }
  
  memories.forEach(m => console.log(`  - ${m.date}`));
  console.log('');
  
  // Extract patterns
  console.log('🔍 Extracting patterns...');
  const patterns = extractPatterns(memories);
  
  console.log(`  - Topics found: ${Object.keys(patterns.topics).length}`);
  console.log(`  - Decisions: ${patterns.decisions.length}`);
  console.log(`  - Wins: ${patterns.wins.length}`);
  console.log(`  - Failures: ${patterns.failures.length}`);
  console.log(`  - Recurring themes: ${patterns.recurringThemes.length}`);
  console.log('');
  
  // Generate insights
  console.log('💡 Generating insights...');
  const insights = generateInsights(patterns);
  insights.forEach(i => console.log(`  - ${i.substring(0, 80)}...`));
  console.log('');
  
  // Generate report
  const report = generateReport(memories, patterns, insights);
  
  if (dryRun) {
    console.log('📝 REPORT PREVIEW:');
    console.log('==================\n');
    console.log(report.substring(0, 2000));
    console.log('\n... (truncated for preview)');
  } else {
    // Save report
    const reportDate = new Date().toISOString().split('T')[0];
    const filename = `weekly-pattern-report-${reportDate}.md`;
    const filepath = path.join(REPORTS_DIR, filename);
    
    fs.writeFileSync(filepath, report);
    console.log(`✅ Report saved: ops/pattern-reports/${filename}`);
    
    // Also save to memory file
    const memoryReportPath = path.join(MEMORY_DIR, `pattern-report-${reportDate}.md`);
    fs.writeFileSync(memoryReportPath, report);
    console.log(`✅ Report saved to memory: memory/pattern-report-${reportDate}.md`);
    
    // Print summary to console for Telegram
    console.log('\n📱 TELEGRAM SUMMARY:');
    console.log('===================\n');
    console.log(`📊 Weekly Pattern Report — ${memories[memories.length-1].date} to ${memories[0].date}\n`);
    console.log(`Decisions: ${patterns.decisions.length} | Wins: ${patterns.wins.length} | Failures: ${patterns.failures.length}`);
    console.log(`\nTop Topics:`);
    Object.entries(patterns.topics).slice(0, 3).forEach(([t, c]) => console.log(`  • ${t}: ${c}`));
    console.log(`\n${insights[0] || 'No major insights this week.'}`);
  }
}

main();
