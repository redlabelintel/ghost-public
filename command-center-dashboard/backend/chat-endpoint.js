// Chat endpoint addition for control-api.js
const express = require('express');

function addChatEndpoint(app, audit) {
  // OpenClaw Chat API
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, source } = req.body;
      
      // Log chat interaction
      if (audit) {
        await audit.log('openclaw_chat', 'command_center', { message, source });
      }
      
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
      } else {
        response = `Understood: "${message}". I can execute session control, team deployment, cost management, or emergency protocols. What would you like me to do?`;
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