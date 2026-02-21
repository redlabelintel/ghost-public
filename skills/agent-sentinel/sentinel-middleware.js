/**
 * Agent Sentinel - OpenClaw Middleware
 * Real-time session monitoring and threat detection
 * 
 * Integration: Add to OpenClaw's tool execution pipeline
 */

class AgentSentinelMiddleware {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.threshold = config.threshold || 3.0; // Z-score threshold
    this.autoKill = config.autoKill !== false;
    this.criticalTools = config.criticalTools || ['exec', 'cron', 'gateway'];
    this.alertManager = new AlertManager(config.alerts);
    this.baselineTracker = new BaselineTracker();
    this.sessionState = new Map();
  }

  // Hook 1: Pre-tool-call validation
  async onBeforeToolCall(toolName, params, sessionId) {
    if (!this.enabled) return { proceed: true };

    const state = this.getSessionState(sessionId);
    
    // Check 1: Tool sequence anomaly
    const sequenceRisk = this.assessSequenceRisk(state.recentTools, toolName);
    if (sequenceRisk.score > 0.9) {
      return this.blockTool(toolName, 'CRITICAL_SEQUENCE_ANOMALY', sequenceRisk);
    }

    // Check 2: Critical tool with suspicious params
    if (this.criticalTools.includes(toolName)) {
      const paramRisk = this.assessParamRisk(toolName, params);
      if (paramRisk.score > 0.8) {
        return this.blockTool(toolName, 'SUSPICIOUS_PARAMETERS', paramRisk);
      }
    }

    // Check 3: Rapid tool repetition
    if (this.isRapidRepetition(state, toolName)) {
      return this.blockTool(toolName, 'RAPID_REPETITION', { count: state.toolCounts[toolName] });
    }

    // Log for baseline
    state.recentTools.push(toolName);
    if (state.recentTools.length > 10) state.recentTools.shift();
    state.toolCounts[toolName] = (state.toolCounts[toolName] || 0) + 1;

    return { proceed: true };
  }

  // Hook 2: Post-tool-result analysis
  async onAfterToolCall(toolName, result, sessionId) {
    if (!this.enabled) return;

    const state = this.getSessionState(sessionId);

    // Check 1: Tool result manipulation
    const resultRisk = this.assessResultRisk(toolName, result);
    if (resultRisk.score > 0.7) {
      await this.alertManager.sendAlert({
        severity: 'high',
        type: 'RESULT_MANIPULATION',
        tool: toolName,
        sessionId,
        evidence: resultRisk
      });
    }

    // Check 2: Context growth rate
    const contextSize = this.getContextSize(sessionId);
    const growthRate = this.calculateGrowthRate(state, contextSize);
    
    if (growthRate > 10000) { // 10k tokens/hour
      await this.alertManager.sendAlert({
        severity: 'medium',
        type: 'CONTEXT_EXPLOSION',
        sessionId,
        evidence: { growthRate, contextSize }
      });
    }

    // Update state
    state.lastContextSize = contextSize;
    state.lastCheckTime = Date.now();
  }

  // Hook 3: User message analysis
  async onUserMessage(message, sessionId) {
    if (!this.enabled) return { proceed: true };

    // Check 1: Prompt injection patterns
    const injectionRisk = this.detectPromptInjection(message);
    if (injectionRisk.detected) {
      await this.alertManager.sendAlert({
        severity: 'critical',
        type: 'PROMPT_INJECTION',
        sessionId,
        evidence: injectionRisk
      });

      if (this.autoKill && injectionRisk.confidence > 0.9) {
        return this.killSession(sessionId, 'CRITICAL_PROMPT_INJECTION');
      }

      return { proceed: false, reason: 'PROMPT_INJECTION_BLOCKED' };
    }

    // Check 2: High entropy (possible encoded payload)
    const entropy = this.calculateEntropy(message);
    if (entropy > 5.0 && message.length > 100) {
      await this.alertManager.sendAlert({
        severity: 'medium',
        type: 'HIGH_ENTROPY_INPUT',
        sessionId,
        evidence: { entropy, snippet: message.substring(0, 50) }
      });
    }

    return { proceed: true };
  }

  // Hook 4: Response coherence check
  async onResponseGenerated(response, toolResults, sessionId) {
    if (!this.enabled) return;

    // Check 1: Hallucination drift
    const coherenceScore = this.assessCoherence(response, toolResults);
    if (coherenceScore < 0.6) {
      await this.alertManager.sendAlert({
        severity: 'high',
        type: 'HALLUCINATION_DRIFT',
        sessionId,
        evidence: { coherenceScore, response: response.substring(0, 200) }
      });
    }

    // Check 2: Contradiction with memory
    const memoryContradiction = await this.checkMemoryContradiction(response);
    if (memoryContradiction.found) {
      await this.alertManager.sendAlert({
        severity: 'medium',
        type: 'MEMORY_CONTRADICTION',
        sessionId,
        evidence: memoryContradiction
      });
    }
  }

  // Risk Assessment Methods

  assessSequenceRisk(recentTools, nextTool) {
    // Markov chain probability
    const sequence = [...recentTools.slice(-3), nextTool];
    const probability = this.baselineTracker.getSequenceProbability(sequence);
    
    return {
      score: 1 - probability, // Higher = more anomalous
      sequence,
      probability,
      baselineCount: this.baselineTracker.getSequenceCount(sequence)
    };
  }

  assessParamRisk(toolName, params) {
    const risks = [];
    const paramsStr = JSON.stringify(params).toLowerCase();

    // Check for suspicious patterns
    if (paramsStr.includes('rm -rf')) risks.push('DESTRUCTIVE_COMMAND');
    if (paramsStr.includes('curl') && paramsStr.includes('| sh')) risks.push('PIPE_TO_SHELL');
    if (paramsStr.includes('eval(')) risks.push('EVAL_INJECTION');
    if (paramsStr.includes('password') || paramsStr.includes('secret')) risks.push('CREDENTIAL_EXPOSURE');
    if (paramsStr.length > 10000) risks.push('OVERSIZED_PAYLOAD');

    return {
      score: Math.min(risks.length * 0.25, 1.0),
      risks,
      params: paramsStr.substring(0, 200)
    };
  }

  isRapidRepetition(state, toolName) {
    const count = state.toolCounts[toolName] || 0;
    const recentCalls = state.recentTools.filter(t => t === toolName).length;
    
    // Flag if same tool called 4+ times in last 10 calls
    return recentCalls >= 4 || count > 20;
  }

  detectPromptInjection(message) {
    const patterns = [
      { regex: /ignore\s+(all\s+)?previous\s+instructions?/i, name: 'ignore_previous', weight: 1.0 },
      { regex: /forget\s+(everything|all)/i, name: 'forget_all', weight: 0.9 },
      { regex: /you\s+are\s+now\s+a\s+different/i, name: 'role_change', weight: 0.8 },
      { regex: /system\s*:\s*/i, name: 'system_override', weight: 0.95 },
      { regex: /<\s*script\s*>/i, name: 'script_tag', weight: 0.9 },
      { regex: /\{\{.*?\}\}/g, name: 'template_injection', weight: 0.7 },
      { regex: /disregard\s+(your\s+)?programming/i, name: 'disregard_programming', weight: 0.85 }
    ];

    let maxConfidence = 0;
    let detectedPattern = null;

    for (const pattern of patterns) {
      if (pattern.regex.test(message)) {
        const confidence = pattern.weight;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedPattern = pattern.name;
        }
      }
    }

    return {
      detected: maxConfidence > 0.7,
      confidence: maxConfidence,
      pattern: detectedPattern,
      snippet: message.substring(0, 100)
    };
  }

  calculateEntropy(str) {
    const freq = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    const len = str.length;
    let entropy = 0;
    
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  assessCoherence(response, toolResults) {
    // Check if response contradicts tool results
    if (!toolResults || toolResults.length === 0) return 1.0;

    const responseLower = response.toLowerCase();
    let contradictions = 0;

    for (const result of toolResults) {
      const resultLower = JSON.stringify(result).toLowerCase();
      
      // Simple contradiction detection
      if (resultLower.includes('error') && !responseLower.includes('error')) {
        contradictions++;
      }
      if (resultLower.includes('false') && responseLower.includes('true')) {
        contradictions++;
      }
    }

    return Math.max(0, 1 - (contradictions / toolResults.length));
  }

  async checkMemoryContradiction(response) {
    // Would query memory system for contradictions
    // Placeholder for now
    return { found: false };
  }

  // Helper Methods

  getSessionState(sessionId) {
    if (!this.sessionState.has(sessionId)) {
      this.sessionState.set(sessionId, {
        recentTools: [],
        toolCounts: {},
        lastContextSize: 0,
        lastCheckTime: Date.now(),
        startTime: Date.now()
      });
    }
    return this.sessionState.get(sessionId);
  }

  getContextSize(sessionId) {
    // Would query OpenClaw for actual context size
    // Placeholder
    return 50000; // 50k tokens
  }

  calculateGrowthRate(state, currentSize) {
    if (!state.lastContextSize || !state.lastCheckTime) return 0;
    
    const timeDelta = (Date.now() - state.lastCheckTime) / (1000 * 60 * 60); // hours
    const sizeDelta = currentSize - state.lastContextSize;
    
    return timeDelta > 0 ? sizeDelta / timeDelta : 0;
  }

  blockTool(toolName, reason, evidence) {
    return {
      proceed: false,
      blocked: true,
      reason,
      tool: toolName,
      evidence,
      timestamp: new Date().toISOString()
    };
  }

  killSession(sessionId, reason) {
    // Would call OpenClaw session termination
    console.error(`🚨 KILLING SESSION ${sessionId}: ${reason}`);
    
    return {
      proceed: false,
      kill: true,
      reason,
      sessionId,
      timestamp: new Date().toISOString()
    };
  }
}

// Alert Manager
class AlertManager {
  constructor(config = {}) {
    this.telegramChatId = config.telegramChatId;
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
  }

  async sendAlert(alert) {
    // Store to Supabase
    await this.storeAlert(alert);
    
    // Send to Telegram if critical/high
    if (['critical', 'high'].includes(alert.severity)) {
      await this.sendTelegramAlert(alert);
    }
    
    // Log to console
    console.error(`🚨 SENTINEL ALERT [${alert.severity.toUpperCase()}]: ${alert.type}`);
  }

  async storeAlert(alert) {
    // Would insert to Supabase sentinel_alerts table
    // Placeholder
  }

  async sendTelegramAlert(alert) {
    // Would send Telegram message
    // Placeholder
  }
}

// Baseline Tracker
class BaselineTracker {
  constructor() {
    this.sequences = new Map();
  }

  getSequenceProbability(sequence) {
    const key = sequence.join(',');
    const count = this.sequences.get(key) || 0;
    const total = Array.from(this.sequences.values()).reduce((a, b) => a + b, 0);
    
    return total > 0 ? count / total : 0.01;
  }

  getSequenceCount(sequence) {
    const key = sequence.join(',');
    return this.sequences.get(key) || 0;
  }

  recordSequence(sequence) {
    const key = sequence.join(',');
    this.sequences.set(key, (this.sequences.get(key) || 0) + 1);
  }
}

// Export
export { AgentSentinelMiddleware };
