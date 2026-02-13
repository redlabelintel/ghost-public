#!/usr/bin/env node

/**
 * Session Guardian - Auto Kill Expensive Sessions
 * Protects against runaway API costs by monitoring and terminating expensive sessions
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  // Cost thresholds
  DAILY_BUDGET_LIMIT: 50.0,      // Daily spending limit in USD
  SESSION_COST_KILL: 100.0,      // Kill session if it exceeds this cost
  SESSION_COST_WARNING: 15.0,    // Warning threshold
  HOURLY_BURN_RATE: 15.0,        // Kill if burning more than this per hour for 2+ hours
  
  // Token thresholds
  TOKEN_KILL_THRESHOLD: 2000000, // Kill session if it exceeds 2M tokens
  TOKEN_WARNING: 1000000,        // Warning at 1M tokens
  
  // Message count thresholds
  MESSAGE_KILL_THRESHOLD: 2000,  // Kill session with excessive messages
  
  // Time thresholds
  MAX_SESSION_HOURS: 24,         // Kill sessions running more than 24 hours
  
  // File size thresholds (in bytes)
  MAX_SESSION_LOG_SIZE: 50 * 1024 * 1024, // 50MB transcript size limit
  
  // Whitelisted sessions (never kill these)
  PROTECTED_SESSIONS: ['main', 'system', 'guardian', 'monitor'],
  
  // Logging
  LOG_PATH: '/Users/ghost/.openclaw/workspace/logs/session-guardian.log',
  STATS_PATH: '/Users/ghost/.openclaw/workspace/logs/guardian-stats.json'
};

// Initialize logging directory
const logDir = path.dirname(CONFIG.LOG_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  console.log(`[SESSION GUARDIAN] ${message}`);
  
  try {
    fs.appendFileSync(CONFIG.LOG_PATH, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

function saveStats(stats) {
  try {
    fs.writeFileSync(CONFIG.STATS_PATH, JSON.stringify(stats, null, 2));
  } catch (error) {
    log(`Failed to save stats: ${error.message}`);
  }
}

function isProtectedSession(sessionId, sessionData) {
  if (!sessionId) return false;
  
  const sessionStr = `${sessionId} ${JSON.stringify(sessionData)}`.toLowerCase();
  return CONFIG.PROTECTED_SESSIONS.some(keyword => sessionStr.includes(keyword));
}

function estimateCost(tokens, model = 'claude-sonnet-4') {
  // Rough cost estimation based on model
  const rates = {
    'claude-sonnet-4': 0.0001,    // $0.0001 per 1K tokens (rough estimate)
    'gpt-4': 0.00012,             // $0.00012 per 1K tokens
    'qwen2.5-7b': 0,              // Local model, no cost
    'default': 0.0001
  };
  
  const rate = rates[model] || rates.default;
  return (tokens / 1000) * rate;
}

function parseSessionsList() {
  try {
    log('Fetching active sessions...');
    const output = execSync('openclaw sessions list', { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    // Parse text output instead of expecting JSON
    const lines = output.split('\n').filter(line => line.trim());
    const sessions = [];
    
    for (const line of lines) {
      if (line.includes('sessionKey') || line.includes('tokens') || line.includes('cost')) {
        // Extract session data from text format
        const sessionMatch = line.match(/sessionKey:\s*([^\s]+)/);
        const tokensMatch = line.match(/tokens:\s*([0-9,]+)/);
        const costMatch = line.match(/cost:\s*\$([0-9.]+)/);
        
        if (sessionMatch) {
          sessions.push({
            id: sessionMatch[1],
            tokens: tokensMatch ? parseInt(tokensMatch[1].replace(',', '')) : 0,
            cost: costMatch ? parseFloat(costMatch[1]) : 0
          });
        }
      }
    }
    
    log(`Found ${sessions.length} active sessions`);
    return sessions;
  } catch (error) {
    log(`Failed to get sessions list: ${error.message}`);
    return [];
  }
}

function killSession(sessionId, reason) {
  try {
    log(`KILLING SESSION: ${sessionId} - Reason: ${reason}`);
    
    execSync(`openclaw sessions kill ${sessionId}`, { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    log(`✅ SESSION TERMINATED: ${sessionId}`);
    return true;
  } catch (error) {
    log(`❌ FAILED TO KILL SESSION ${sessionId}: ${error.message}`);
    return false;
  }
}

function analyzeSession(session) {
  const issues = [];
  const warnings = [];
  
  // Extract session data
  const sessionId = session.id || session.sessionKey || 'unknown';
  const tokens = parseInt(session.tokens) || 0;
  const messages = parseInt(session.messages) || 0;
  const cost = parseFloat((session.cost || '0').replace('$', '')) || 0;
  const model = session.model || 'unknown';
  const duration = session.duration || 0;
  
  // Check if protected
  if (isProtectedSession(sessionId, session)) {
    return { sessionId, issues: [], warnings: [], protected: true };
  }
  
  // Cost analysis
  if (cost > CONFIG.SESSION_COST_KILL) {
    issues.push(`COST_EXCEEDED: $${cost.toFixed(2)} > $${CONFIG.SESSION_COST_KILL}`);
  } else if (cost > CONFIG.SESSION_COST_WARNING) {
    warnings.push(`HIGH_COST: $${cost.toFixed(2)}`);
  }
  
  // Token analysis
  if (tokens > CONFIG.TOKEN_KILL_THRESHOLD) {
    issues.push(`TOKEN_EXCEEDED: ${tokens.toLocaleString()} > ${CONFIG.TOKEN_KILL_THRESHOLD.toLocaleString()}`);
  } else if (tokens > CONFIG.TOKEN_WARNING) {
    warnings.push(`HIGH_TOKENS: ${tokens.toLocaleString()}`);
  }
  
  // Message count analysis
  if (messages > CONFIG.MESSAGE_KILL_THRESHOLD) {
    issues.push(`MESSAGE_EXCEEDED: ${messages} > ${CONFIG.MESSAGE_KILL_THRESHOLD}`);
  }
  
  // Duration analysis (in hours)
  const hours = duration / 3600;
  if (hours > CONFIG.MAX_SESSION_HOURS) {
    issues.push(`DURATION_EXCEEDED: ${hours.toFixed(1)}h > ${CONFIG.MAX_SESSION_HOURS}h`);
  }
  
  // Burn rate analysis (rough estimate)
  if (hours > 2 && cost > 0) {
    const hourlyBurn = cost / hours;
    if (hourlyBurn > CONFIG.HOURLY_BURN_RATE) {
      issues.push(`BURN_RATE_HIGH: $${hourlyBurn.toFixed(2)}/hr > $${CONFIG.HOURLY_BURN_RATE}/hr`);
    }
  }
  
  return { 
    sessionId, 
    issues, 
    warnings, 
    protected: false,
    cost,
    tokens,
    messages,
    hours,
    model
  };
}

async function runGuardianScan() {
  log('🛡️ Session Guardian scan initiated');
  
  const stats = {
    timestamp: new Date().toISOString(),
    totalSessions: 0,
    protectedSessions: 0,
    killedSessions: 0,
    warningsIssued: 0,
    totalCostSaved: 0,
    sessionsAnalyzed: []
  };
  
  try {
    const sessions = parseSessionsList();
    stats.totalSessions = sessions.length;
    
    if (sessions.length === 0) {
      log('No active sessions found');
      saveStats(stats);
      return stats;
    }
    
    const killedSessions = [];
    const warningSessions = [];
    
    for (const session of sessions) {
      const analysis = analyzeSession(session);
      stats.sessionsAnalyzed.push(analysis);
      
      if (analysis.protected) {
        stats.protectedSessions++;
        log(`PROTECTED: ${analysis.sessionId} (system session)`);
        continue;
      }
      
      if (analysis.issues.length > 0) {
        const reason = analysis.issues.join(', ');
        log(`TARGET FOR TERMINATION: ${analysis.sessionId} - ${reason}`);
        
        if (killSession(analysis.sessionId, reason)) {
          killedSessions.push({
            sessionId: analysis.sessionId,
            reason,
            costSaved: analysis.cost,
            tokensSaved: analysis.tokens
          });
          
          stats.killedSessions++;
          stats.totalCostSaved += analysis.cost;
        }
      } else if (analysis.warnings.length > 0) {
        const warningText = analysis.warnings.join(', ');
        log(`WARNING: ${analysis.sessionId} - ${warningText}`);
        
        warningSessions.push({
          sessionId: analysis.sessionId,
          warnings: analysis.warnings
        });
        
        stats.warningsIssued++;
      }
    }
    
    // Summary report
    log(`📊 GUARDIAN SCAN COMPLETE`);
    log(`   Sessions scanned: ${stats.totalSessions}`);
    log(`   Protected sessions: ${stats.protectedSessions}`);
    log(`   Sessions killed: ${stats.killedSessions}`);
    log(`   Warnings issued: ${stats.warningsIssued}`);
    log(`   Cost saved: $${stats.totalCostSaved.toFixed(2)}`);
    
    if (killedSessions.length > 0) {
      log('🔥 TERMINATED SESSIONS:');
      killedSessions.forEach(killed => {
        log(`   ${killed.sessionId}: ${killed.reason} (saved $${killed.costSaved.toFixed(2)})`);
      });
    }
    
    saveStats(stats);
    
  } catch (error) {
    log(`❌ Guardian scan failed: ${error.message}`);
    stats.error = error.message;
    saveStats(stats);
  }
  
  return stats;
}

// Main execution
async function main() {
  log('Session Guardian starting...');
  
  try {
    const stats = await runGuardianScan();
    
    // Exit code based on results
    if (stats.killedSessions > 0) {
      log(`Exiting with status: ${stats.killedSessions} sessions killed`);
      process.exit(0);
    } else if (stats.error) {
      log('Exiting with error status');
      process.exit(1);
    } else {
      log('Scan complete - all sessions healthy');
      process.exit(0);
    }
    
  } catch (error) {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Handle signals gracefully
process.on('SIGINT', () => {
  log('Session Guardian interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Session Guardian terminated');
  process.exit(1);
});

// Run the guardian
main();