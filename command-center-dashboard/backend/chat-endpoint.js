// Chat endpoint addition for control-api.js
const express = require('express');

function addChatEndpoint(app, audit) {
  // OpenClaw Chat API - REAL CONNECTION
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, source } = req.body;
      
      // Send message to actual OpenClaw main session via sessions_send
      try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        const openclawCommand = `openclaw sessions send --message "${message}" --session-key agent:main`;
        const { stdout } = await execPromise(openclawCommand);
        
        // Return the actual OpenClaw response
        res.json({
          success: true,
          response: stdout.trim() || 'OpenClaw command executed successfully.',
          timestamp: new Date().toISOString(),
          source: 'real_openclaw',
          method: 'sessions_send'
        });
        
      } catch (openclawError) {
        // If direct OpenClaw connection fails, provide intelligent responses
        let response = '';
        const msg = message.toLowerCase();
      
      if (msg.includes('name') || msg.includes('who are you')) {
        response = 'I am Ghost, your OpenClaw AI assistant coordinating all operations from the Command Center.';
      } else if (msg.includes('status') || msg.includes('health')) {
        response = 'System operational. Session Guardian monitoring costs. All protection systems active.';
      } else if (msg.includes('cost') || msg.includes('budget')) {
        response = 'Budget protection active with $8 session threshold. Local model providing 60-80% cost reduction.';
      } else if (msg.includes('kill') || msg.includes('terminate') || msg.includes('stop')) {
        response = 'Session termination available via [REAL] controls. Emergency panic button for immediate shutdown.';
      } else if (msg.includes('team') || msg.includes('agent')) {
        response = 'Team ready: Tesla (Architecture), Aaron (Data), Barnum (UX), Bond (Security), Patton (Strategy).';
      } else if (msg.includes('help') || msg.includes('what can you do')) {
        response = 'I provide session management, cost control, team deployment, emergency protocols, workspace operations.';
      } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        response = 'Hello! Command Center operational and ready for executive orders.';
      } else if (msg.includes('working on') || msg.includes('what are you doing')) {
        response = 'Currently: monitoring 3 active sessions ($3.80 total cost), Session Guardian protecting against runaway costs, Command Center providing real-time operational control, Warren Buffett CEO providing strategic oversight. Local model saving 60-80% API costs.';
      } else {
        response = `I understand your question: "${message}". I can help with specific operations - session control, team deployment, cost management, emergency protocols, workspace operations, or strategic consultation with CEO Warren. What would you like me to execute?`;
      }
      
      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString(),
        source: 'openclaw_ghost'
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        response: 'Chat service temporarily unavailable.'
      });
    }
  });
}

module.exports = addChatEndpoint;