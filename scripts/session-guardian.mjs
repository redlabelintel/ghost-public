#!/usr/bin/env node

/**
 * Session Guardian - Auto Kill Expensive Sessions
 * Protects against runaway API costs by monitoring and terminating expensive sessions
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

// Configuration
const CONFIG = {
  // Cost thresholds - MUCH MORE AGGRESSIVE
  DAILY_BUDGET_LIMIT: 25.0,      // Daily spending limit in USD (reduced from 50)
  SESSION_COST_KILL: 25.0,       // Kill session if it exceeds this cost (reduced from 100)
  SESSION_COST_WARNING: 8.0,     // Warning threshold (reduced from 15)
  HOURLY_BURN_RATE: 5.0,         // Kill if burning more than this per hour (reduced from 15)
  
  // Token thresholds - AGGRESSIVE CONTEXT MONITORING
  TOKEN_KILL_THRESHOLD: 800000,  // Kill session at 800k tokens (reduced from 2M)
  TOKEN_WARNING: 500000,         // Warning at 500k tokens (reduced from 1M)
  CONTEXT_WARNING: 0.8,          // Warning at 80% context usage
  CONTEXT_KILL: 0.95,            // Kill at 95% context usage
  
  // Session count thresholds - NEW
  MAX_TOTAL_SESSIONS: 50,        // Warning if more than 50 total sessions
  CRITICAL_SESSION_COUNT: 100,   // Critical warning if more than 100 sessions
  
  // Message count thresholds
  MESSAGE_KILL_THRESHOLD: 1000,  // Kill session with excessive messages (reduced)
  
  // Time thresholds - MORE AGGRESSIVE
  MAX_SESSION_HOURS: 8,          // Kill sessions running more than 8 hours (reduced from 24)
  WARNING_SESSION_HOURS: 4,      // Warning for sessions >4 hours
  
  // File size thresholds (in bytes)
  MAX_SESSION_LOG_SIZE: 20 * 1024 * 1024, // 20MB transcript size limit (reduced)
  
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

// Check main session status via OpenClaw gateway
async function checkMainSession() {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: 18789,
      path: '/api/v1/status',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const status = JSON.parse(data);
          const session = status.session;
          
          if (session && session.contextWindow && session.contextWindow.max > 0) {
            const used = session.contextWindow.used || 0;
            const max = session.contextWindow.max;
            const percentage = (used / max);
            const tokens = session.tokens?.total || 0;
            
            log(`Main session context: ${used}/${max} (${(percentage * 100).toFixed(1)}%)`);
            
            const result = {
              id: 'main:current',
              tokens: tokens,
              contextUsed: used,
              contextMax: max,
              contextPercent: percentage,
              isMainSession: true
            };
            
            // Check thresholds
            if (percentage >= CONFIG.CONTEXT_KILL) {
              result.critical = true;
              result.reason = `CONTEXT_CRITICAL: ${(percentage * 100).toFixed(1)}% >= ${(CONFIG.CONTEXT_KILL * 100)}%`;
              log(`🚨 CRITICAL: Main session context at ${(percentage * 100).toFixed(1)}%`);
            } else if (percentage >= CONFIG.CONTEXT_WARNING) {
              result.warning = true;
              result.reason = `CONTEXT_WARNING: ${(percentage * 100).toFixed(1)}% >= ${(CONFIG.CONTEXT_WARNING * 100)}%`;
              log(`⚠️ WARNING: Main session context at ${(percentage * 100).toFixed(1)}%`);
            }
            
            resolve(result);
          } else {
            resolve(null);
          }
        } catch (e) {
          log(`Failed to parse status: ${e.message}`);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      log(`Status check failed: ${err.message}`);
      resolve(null);
    });

    req.on('timeout', () => {
      log('Status check timeout');
      req.destroy();
      resolve(null);
    });

    req.end();
  });
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
    sessionsAnalyzed: [],
    mainSessionAlert: null
  };
  
  // Check main session first
  try {
    const mainSession = await checkMainSession();
    if (mainSession) {
      stats.mainSessionAlert = mainSession;
      
      if (mainSession.critical) {
        log(`🚨 MAIN SESSION CRITICAL: ${mainSession.reason}`);
        // For main session, we can't kill it - just alert
      } else if (mainSession.warning) {
        log(`⚠️ MAIN SESSION WARNING: ${mainSession.reason}`);
        stats.warningsIssued++;
      }
    }
  } catch (error) {
    log(`Failed to check main session: ${error.message}`);
  }
  
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
    
    if (stats.mainSessionAlert) {
      const p = stats.mainSessionAlert.contextPercent;
      log(`   Main session: ${stats.mainSessionAlert.contextUsed}/${stats.mainSessionAlert.contextMax} (${(p*100).toFixed(1)}%)`);
      if (stats.mainSessionAlert.critical) {
        log(`   ⚠️ MAIN SESSION CONTEXT CRITICAL - Restart recommended`);
      } else if (stats.mainSessionAlert.warning) {
        log(`   ⚡ Main session context elevated`);
      }
    }
    
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