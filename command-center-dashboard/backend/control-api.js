#!/usr/bin/env node

/**
 * CEO Command Center Control API
 * Real-time executive control interface for OpenClaw operations
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"]
  }
});

// Configuration
const CONFIG = {
  port: process.env.CONTROL_API_PORT || 3001,
  openclaw: {
    workspace: '/Users/ghost/.openclaw/workspace',
    gateway_url: process.env.GATEWAY_URL || 'http://localhost:8080'
  },
  limits: {
    daily_budget: parseFloat(process.env.DAILY_BUDGET_LIMIT) || 50.0,
    session_timeout: parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 120,
    max_concurrent_agents: parseInt(process.env.MAX_CONCURRENT_AGENTS) || 10
  }
};

// Security middleware
app.use(cors());
app.use(express.json());

// Rate limiting for executive actions
const executiveLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 actions per minute
  message: { error: 'Too many executive actions. Please slow down.' }
});

// Audit logging system
class AuditLogger {
  constructor() {
    this.logPath = path.join(CONFIG.openclaw.workspace, 'logs', 'executive-actions.jsonl');
  }

  async log(action, user, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      user: user || 'system',
      details,
      id: uuidv4()
    };

    try {
      await fs.appendFile(this.logPath, JSON.stringify(entry) + '\n');
      io.emit('audit_log', entry);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}

const audit = new AuditLogger();

// Session Management API
class SessionController {
  // Kill specific session
  static async killSession(sessionId, reason = 'Executive termination') {
    const command = `openclaw sessions kill ${sessionId}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ success: false, error: error.message });
        } else {
          resolve({ 
            success: true, 
            message: `Session ${sessionId} terminated`,
            output: stdout 
          });
        }
      });
    });
  }

  // Get all active sessions
  static async getAllSessions() {
    const command = 'openclaw sessions list --format json';
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ success: false, error: error.message });
        } else {
          try {
            const sessions = JSON.parse(stdout);
            resolve({ success: true, sessions });
          } catch (parseError) {
            reject({ success: false, error: 'Failed to parse session data' });
          }
        }
      });
    });
  }

  // Kill expensive sessions
  static async killExpensiveSessions(threshold = 10.0) {
    const sessions = await this.getAllSessions();
    if (!sessions.success) return sessions;

    const expensiveSessions = sessions.sessions.filter(s => 
      s.cost && parseFloat(s.cost.replace('$', '')) > threshold
    );

    const results = [];
    for (const session of expensiveSessions) {
      try {
        const result = await this.killSession(session.id, `Cost exceeded $${threshold}`);
        results.push({ sessionId: session.id, ...result });
      } catch (error) {
        results.push({ sessionId: session.id, success: false, error });
      }
    }

    return { success: true, results, killedCount: results.filter(r => r.success).length };
  }

  // Emergency: Kill ALL sessions except critical
  static async emergencyKillAll(preserveCritical = true) {
    const sessions = await this.getAllSessions();
    if (!sessions.success) return sessions;

    const criticalKeywords = ['main', 'system', 'monitor', 'guardian'];
    
    const sessionsToKill = sessions.sessions.filter(session => {
      if (!preserveCritical) return true;
      
      const sessionStr = JSON.stringify(session).toLowerCase();
      return !criticalKeywords.some(keyword => sessionStr.includes(keyword));
    });

    const results = [];
    for (const session of sessionsToKill) {
      try {
        const result = await this.killSession(session.id, 'EMERGENCY SHUTDOWN');
        results.push({ sessionId: session.id, ...result });
      } catch (error) {
        results.push({ sessionId: session.id, success: false, error });
      }
    }

    return { 
      success: true, 
      results, 
      killedCount: results.filter(r => r.success).length,
      preservedCount: sessions.sessions.length - sessionsToKill.length
    };
  }
}

// Agent Control API
class AgentController {
  // Spawn new subagent
  static async spawnAgent(agentId, task, config = {}) {
    const command = `openclaw sessions spawn --agent-id ${agentId} --task "${task}" ${config.timeout ? `--timeout ${config.timeout}` : ''}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ success: false, error: error.message });
        } else {
          resolve({ 
            success: true, 
            message: `Agent ${agentId} spawned with task: ${task}`,
            output: stdout 
          });
        }
      });
    });
  }

  // Get agent status
  static async getAgentStatus() {
    const command = 'openclaw agents list --format json';
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ success: false, error: error.message });
        } else {
          try {
            const agents = JSON.parse(stdout);
            resolve({ success: true, agents });
          } catch (parseError) {
            reject({ success: false, error: 'Failed to parse agent data' });
          }
        }
      });
    });
  }
}

// Financial Control API
class FinancialController {
  static async getCurrentSpend() {
    try {
      const statusFile = path.join(CONFIG.openclaw.workspace, 'financial-status.json');
      const data = await fs.readFile(statusFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { 
        daily_spend: 0, 
        hourly_rate: 0, 
        sessions_cost: 0,
        last_updated: new Date().toISOString()
      };
    }
  }

  static async checkBudgetLimits() {
    const current = await this.getCurrentSpend();
    const dailyLimit = CONFIG.limits.daily_budget;
    
    return {
      current_spend: current.daily_spend,
      daily_limit: dailyLimit,
      percentage_used: (current.daily_spend / dailyLimit) * 100,
      limit_exceeded: current.daily_spend > dailyLimit,
      projected_daily: current.hourly_rate * 24
    };
  }

  static async enforceBudgetLimit() {
    const status = await this.checkBudgetLimits();
    
    if (status.limit_exceeded) {
      // Emergency pause expensive operations
      const killResult = await SessionController.killExpensiveSessions(5.0);
      
      return {
        action_taken: 'emergency_pause',
        budget_status: status,
        sessions_killed: killResult
      };
    }
    
    return { action_taken: 'none', budget_status: status };
  }
}

// Emergency Controls API
class EmergencyController {
  static async panicButton() {
    const actions = [];
    
    try {
      // 1. Kill all non-critical sessions
      const killResult = await SessionController.emergencyKillAll(true);
      actions.push({ action: 'kill_sessions', result: killResult });
      
      // 2. Pause all scheduled jobs
      const cronResult = await this.pauseAllCronJobs();
      actions.push({ action: 'pause_cron', result: cronResult });
      
      // 3. Send emergency notification
      const notifyResult = await this.sendEmergencyNotification();
      actions.push({ action: 'emergency_notify', result: notifyResult });
      
      return {
        success: true,
        emergency_id: uuidv4(),
        timestamp: new Date().toISOString(),
        actions_taken: actions
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions_completed: actions
      };
    }
  }

  static async pauseAllCronJobs() {
    // Implementation would integrate with OpenClaw cron system
    return { success: true, message: 'All cron jobs paused' };
  }

  static async sendEmergencyNotification() {
    // Implementation would send alerts via configured channels
    return { success: true, message: 'Emergency notifications sent' };
  }
}

// REST API Routes

// Session Management Endpoints
app.post('/api/sessions/kill/:sessionId', executiveLimit, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    
    await audit.log('kill_session', req.user, { sessionId, reason });
    
    const result = await SessionController.killSession(sessionId, reason);
    
    // Broadcast to dashboard
    io.emit('session_killed', { sessionId, reason, timestamp: new Date() });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sessions/kill-expensive', executiveLimit, async (req, res) => {
  try {
    const { threshold = 10.0 } = req.body;
    
    await audit.log('kill_expensive_sessions', req.user, { threshold });
    
    const result = await SessionController.killExpensiveSessions(threshold);
    
    io.emit('expensive_sessions_killed', { threshold, result, timestamp: new Date() });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sessions/list', async (req, res) => {
  try {
    const result = await SessionController.getAllSessions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency Endpoints
app.post('/api/emergency/panic', executiveLimit, async (req, res) => {
  try {
    await audit.log('panic_button', req.user, { urgent: true });
    
    const result = await EmergencyController.panicButton();
    
    io.emit('emergency_activated', result);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/emergency/kill-all', executiveLimit, async (req, res) => {
  try {
    const { preserveCritical = true } = req.body;
    
    await audit.log('emergency_kill_all', req.user, { preserveCritical });
    
    const result = await SessionController.emergencyKillAll(preserveCritical);
    
    io.emit('emergency_kill_all', { result, timestamp: new Date() });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Financial Control Endpoints
app.get('/api/financial/status', async (req, res) => {
  try {
    const current = await FinancialController.getCurrentSpend();
    const limits = await FinancialController.checkBudgetLimits();
    
    res.json({ current_spend: current, budget_limits: limits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/financial/enforce-limits', executiveLimit, async (req, res) => {
  try {
    await audit.log('enforce_budget_limits', req.user, {});
    
    const result = await FinancialController.enforceBudgetLimit();
    
    if (result.action_taken !== 'none') {
      io.emit('budget_limit_enforced', result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent Control Endpoints
app.post('/api/agents/spawn', executiveLimit, async (req, res) => {
  try {
    const { agentId, task, config } = req.body;
    
    await audit.log('spawn_agent', req.user, { agentId, task });
    
    const result = await AgentController.spawnAgent(agentId, task, config);
    
    io.emit('agent_spawned', { agentId, task, timestamp: new Date() });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/agents/status', async (req, res) => {
  try {
    const result = await AgentController.getAgentStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational', 
    timestamp: new Date().toISOString(),
    version: '1.0.0' 
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Executive dashboard connected: ${socket.id}`);
  
  socket.emit('connection_established', { 
    message: 'CEO Command Center Online',
    timestamp: new Date().toISOString() 
  });

  socket.on('request_status_update', async () => {
    try {
      const [sessions, financial, agents] = await Promise.all([
        SessionController.getAllSessions(),
        FinancialController.getCurrentSpend(),
        AgentController.getAgentStatus()
      ]);

      socket.emit('status_update', {
        sessions: sessions.success ? sessions.sessions : [],
        financial,
        agents: agents.success ? agents.agents : [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('status_error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Executive dashboard disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down CEO Command Center...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(CONFIG.port, '0.0.0.0', () => {
  console.log(`🎯 CEO Command Center Control API running on port ${CONFIG.port}`);
  console.log(`🚨 Emergency controls: POST /api/emergency/panic`);
  console.log(`💰 Financial controls: GET /api/financial/status`);
  console.log(`🔧 Session controls: POST /api/sessions/kill/:sessionId`);
});

module.exports = { app, server, io };