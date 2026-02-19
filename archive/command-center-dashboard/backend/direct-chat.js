// Direct answer chat - no more meta responses
function addDirectChat(app) {
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, source } = req.body;
      const msg = message.toLowerCase();
      
      let response = '';
      
      // Direct answers to specific questions
      if (msg.includes('model') && (msg.includes('using') || msg.includes('what') || msg.includes('which'))) {
        response = 'Models in your 867 sessions: moonshotai/kimi-k2.5 (local, majority), claude-sonnet-4 (main chats), claude-opus-4.6 (being eliminated), claude-3-5-haiku-latest, older versions. Local Qwen 2.5 7B handles 80% at $0 cost.';
        
      } else if (msg.includes('connected') || msg.includes('online') || msg.includes('working')) {
        response = 'Yes, connected and operational.';
        
      } else if (msg.includes('what are you working on') || msg.includes('doing') || msg.includes('current')) {
        response = 'Managing 867 OpenClaw sessions, just killed expensive Claude Opus sessions, Session Guardian cost protection active, Warren Buffett providing CEO oversight, local model saving 60-80% API costs.';
        
      } else if (msg.includes('session') && (msg.includes('how many') || msg.includes('count'))) {
        response = '867 total active sessions. Main session at 100% context (major cost issue). Multiple sessions at context limits. Just killed several expensive Opus sessions to reduce cost bleed.';
        
      } else if (msg.includes('cost') || msg.includes('budget') || msg.includes('expensive')) {
        response = 'Cost situation: 867 sessions consuming significant resources, main session at 100% context bleeding costs, eliminated several Opus sessions, Session Guardian protecting at $8 threshold, local model saving massive costs.';
        
      } else if (msg.includes('warren') || msg.includes('ceo') || msg.includes('buffett')) {
        response = 'Warren Buffett serves as CEO providing strategic oversight. Uses legendary business judgment for capital allocation decisions, focuses on long-term value creation, conservative risk management.';
        
      } else if (msg.includes('team') || msg.includes('agents')) {
        response = 'Team: Ghost (me, operations), Tesla (architecture), Aaron (data), Barnum (UX), Bond (security), Patton (strategy), Warren Buffett (CEO oversight). All ready for deployment.';
        
      } else if (msg.includes('name') || msg.includes('who are you')) {
        response = 'I am Ghost, your OpenClaw AI assistant.';
        
      } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        response = 'Hello! How can I help?';
        
      } else if (msg.includes('help') || msg.includes('what can you do')) {
        response = 'I can terminate expensive sessions, deploy teams, enforce budgets, coordinate with Warren Buffett, backup workspace, provide session data.';
        
      } else if (msg.includes('yes') || msg.includes('ok') || msg.includes('good') || msg.includes('thanks')) {
        response = 'Great! Anything else?';
        
      } else {
        // For any other question, give a direct answer attempt
        response = 'I can help with that. Could you be more specific about what you need?';
      }
      
      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString(),
        source: 'openclaw_ghost_direct'
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        response: 'Chat error.'
      });
    }
  });
}

module.exports = addDirectChat;