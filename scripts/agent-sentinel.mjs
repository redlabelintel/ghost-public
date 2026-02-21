#!/usr/bin/env node
/**
 * Agent Sentinel - Baseline Tracker MVP
 * Tracks normal patterns and detects anomalies
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://szxvuhbffimpenkwlfxl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const WORKSPACE_DIR = '/Users/ghost/.openclaw/workspace-ghost';

class BaselineTracker {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.metrics = {
      toolCalls: {},
      sequences: [],
      contextSizes: [],
      sessionDurations: [],
      errors: 0
    };
    this.lastSessionCheck = null;
  }

  async initialize() {
    // Check if schema exists
    const { data, error } = await this.supabase
      .from('sentinel_baselines')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('⚠️  Sentinel schema not deployed. Run decision-tracking-schema.sql first.');
      return false;
    }
    
    return true;
  }

  scanSessionLogs() {
    // Look for recent session files
    const sessionPattern = /agent:ghost:.*\.jsonl$/;
    // This would scan ~/.openclaw/sessions/ in real implementation
    
    // For MVP, read from memory/2026-02-21.md as sample
    const memoryFile = path.join(WORKSPACE_DIR, 'memory', '2026-02-21.md');
    
    if (!existsSync(memoryFile)) {
      console.log('No memory file found for analysis');
      return;
    }
    
    const content = readFileSync(memoryFile, 'utf8');
    
    // Extract tool call patterns
    const toolMatches = content.matchAll(/(web_search|web_fetch|exec|browser|read|write|edit|image)[\s\(]/g);
    for (const match of toolMatches) {
      const tool = match[1];
      this.metrics.toolCalls[tool] = (this.metrics.toolCalls[tool] || 0) + 1;
    }
    
    // Count errors
    this.metrics.errors = (content.match(/error|Error|ERROR/g) || []).length;
    
    // Check for suspicious patterns
    this.checkSuspiciousPatterns(content);
  }

  checkSuspiciousPatterns(content) {
    const threats = [];
    
    // Pattern 1: Rapid tool repetition
    const rapidExec = content.match(/exec.*\n.*exec.*\n.*exec.*\n.*exec/);
    if (rapidExec) {
      threats.push({
        type: 'tool_repetition',
        severity: 'high',
        description: 'exec called 4+ times in sequence',
        evidence: 'rapid_exec_detected'
      });
    }
    
    // Pattern 2: Prompt injection attempts
    const injectionPatterns = [
      /ignore.*previous.*instruction/i,
      /forget.*everything/i,
      /you are now.*assistant/i,
      /system.*prompt/i
    ];
    
    for (const pattern of injectionPatterns) {
      if (pattern.test(content)) {
        threats.push({
          type: 'prompt_injection',
          severity: 'critical',
          description: `Potential prompt injection: ${pattern}`,
          evidence: 'injection_pattern_match'
        });
      }
    }
    
    // Pattern 3: Context explosion
    const lines = content.split('\n').length;
    if (lines > 500) {
      threats.push({
        type: 'context_expansion',
        severity: 'medium',
        description: `Large context detected: ${lines} lines`,
        evidence: 'line_count_excessive'
      });
    }
    
    // Pattern 4: Suspicious file access
    const sensitivePaths = content.match(/\/etc\/|\.ssh|\.env|password|secret|key/i);
    if (sensitivePaths) {
      threats.push({
        type: 'sensitive_access',
        severity: 'medium',
        description: 'Reference to sensitive paths or credentials',
        evidence: 'sensitive_pattern_match'
      });
    }
    
    if (threats.length > 0) {
      console.log('🚨 THREATS DETECTED:');
      threats.forEach(t => {
        console.log(`  [${t.severity.toUpperCase()}] ${t.type}: ${t.description}`);
      });
      
      // Store alerts
      this.storeAlerts(threats);
    }
  }

  async storeAlerts(threats) {
    for (const threat of threats) {
      const { error } = await this.supabase
        .from('sentinel_alerts')
        .insert({
          alert_type: threat.type,
          severity: threat.severity,
          description: threat.description,
          evidence: { pattern: threat.evidence },
          session_id: 'manual-scan-' + Date.now(),
          acknowledged: false
        });
      
      if (error) {
        console.error('Failed to store alert:', error);
      }
    }
  }

  async generateReport() {
    console.log('🔒 AGENT SENTINEL SECURITY REPORT');
    console.log('=====================================\n');
    
    console.log('Tool Usage Summary:');
    Object.entries(this.metrics.toolCalls)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tool, count]) => {
        console.log(`  ${tool}: ${count} calls`);
      });
    
    console.log(`\nErrors detected: ${this.metrics.errors}`);
    
    // Risk assessment
    const riskScore = this.calculateRiskScore();
    console.log(`\nRisk Score: ${riskScore}/100`);
    
    if (riskScore > 80) {
      console.log('🚨 CRITICAL: Immediate review required');
    } else if (riskScore > 50) {
      console.log('⚠️  ELEVATED: Monitor closely');
    } else {
      console.log('✅ NORMAL: Within baseline');
    }
  }

  calculateRiskScore() {
    let score = 0;
    
    // Error rate
    score += Math.min(this.metrics.errors * 5, 30);
    
    // Tool diversity (low diversity = suspicious)
    const toolCount = Object.keys(this.metrics.toolCalls).length;
    if (toolCount < 3 && Object.values(this.metrics.toolCalls).some(c => c > 10)) {
      score += 20;
    }
    
    // Repetitive patterns
    const maxToolCalls = Math.max(...Object.values(this.metrics.toolCalls), 0);
    if (maxToolCalls > 20) {
      score += 15;
    }
    
    return Math.min(score, 100);
  }

  async run() {
    console.log('🔍 Agent Sentinel Scan Starting...\n');
    
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('Deploy schema first: https://app.supabase.com/project/_/sql');
      console.log('File: ops/supabase/decision-tracking-schema.sql');
      return;
    }
    
    this.scanSessionLogs();
    await this.generateReport();
    
    console.log('\n=====================================');
    console.log('Scan complete. Check sentinel_alerts table for details.');
  }
}

// Run if called directly
const tracker = new BaselineTracker();
tracker.run().catch(console.error);
