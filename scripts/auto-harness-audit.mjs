#!/usr/bin/env node
/**
 * Session Failure Monitor
 * Auto-triggers harness audit on session failures
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const ERROR_PATTERNS = [
  /context window.*exhausted/i,
  /token limit/i,
  /rate limit/i,
  /tool.*failed/i,
  /session.*terminated/i,
  /error.*429/i,
  /error.*500/i,
  /timeout/i
];

function checkSessionLogs() {
  // Check for recent errors in session logs
  const logPath = process.env.HOME + '/.openclaw/logs/';
  
  if (!existsSync(logPath)) {
    return [];
  }
  
  // Find recent log files
  const logs = execSync(`ls -lt ${logPath} | head -5`).toString();
  
  const failures = [];
  
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(logs)) {
      failures.push(pattern.toString());
    }
  }
  
  return failures;
}

function triggerHarnessAudit(sessionId) {
  console.log(`🔧 Auto-triggering harness audit for ${sessionId}`);
  
  try {
    // Generate visual HTML report
    const report = generateAuditReport(sessionId);
    
    // Save to ops/harness-audits/
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const auditDir = process.env.HOME + '/.openclaw/workspace-ghost/ops/harness-audits';
    await fs.mkdir(auditDir, { recursive: true });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join(auditDir, `harness-audit-${sessionId}-${timestamp}.html`);
    
    await fs.writeFile(reportPath, report);
    
    console.log(`✅ Harness audit saved: ${reportPath}`);
    
    // Open in browser if on Mac
    try {
      execSync(`open ${reportPath}`);
    } catch {
      // Ignore if no browser
    }
  } catch (err) {
    console.error('❌ Failed to generate harness audit:', err);
  }
}

function generateAuditReport(sessionId) {
  // Use visual-explainer pattern for HTML report
  return `<!DOCTYPE html>
<html>
<head>
  <title>Harness Audit: ${sessionId}</title>
  <style>
    body { font-family: 'IBM Plex Mono', monospace; background: #0d1117; color: #e6edf3; padding: 2rem; }
    .error { color: #f85149; }
    .fix { background: #238636; padding: 0.5rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>🔧 Harness Audit: ${sessionId}</h1>
  <p>Auto-generated on ${new Date().toISOString()}</p>
  
  <h2>Detected Issues</h2>
  <ul>
    <li class="error">Session failure detected</li>
  </ul>
  
  <h2>Recommended Fixes</h2>
  <div class="fix">
    <p>Review harness/ tool-timeouts.yaml</p>
    <p>Check context window management</p>
  </div>
  
  <p><em>Full parallel analysis would run here with 4 specialized agents</em></p>
</body>
</html>`;
}

// Main execution
const failures = checkSessionLogs();

if (failures.length > 0) {
  console.log(`🚨 ${failures.length} failure patterns detected`);
  const sessionId = `auto-${Date.now()}`;
  triggerHarnessAudit(sessionId);
} else {
  console.log('✅ No session failures detected');
}
