import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Zap, DollarSign, Users, Settings, Activity, Shield, Pause } from 'lucide-react';
import io from 'socket.io-client';

const ExecutiveControlPanel = () => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState({
    sessions: [],
    financial: {},
    agents: [],
    connected: false
  });
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [auditLog, setAuditLog] = useState([]);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Connected to CEO Command Center');
      setStatus(prev => ({ ...prev, connected: true }));
      newSocket.emit('request_status_update');
    });

    newSocket.on('status_update', (data) => {
      setStatus(prev => ({ ...prev, ...data }));
    });

    newSocket.on('audit_log', (entry) => {
      setAuditLog(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries
    });

    newSocket.on('emergency_activated', (data) => {
      alert('🚨 EMERGENCY PROTOCOL ACTIVATED');
      newSocket.emit('request_status_update');
    });

    setSocket(newSocket);

    // Request updates every 10 seconds
    const interval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('request_status_update');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  // API call wrapper
  const apiCall = useCallback(async (endpoint, method = 'GET', body = null) => {
    try {
      const response = await fetch(`http://localhost:3001/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null
      });
      
      const result = await response.json();
      
      if (socket) {
        socket.emit('request_status_update');
      }
      
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      return { success: false, error: error.message };
    }
  }, [socket]);

  // Emergency Controls
  const handlePanicButton = () => {
    setShowConfirmation({
      action: 'panic',
      title: '🚨 EMERGENCY PANIC BUTTON',
      message: 'This will immediately pause ALL non-critical operations and kill expensive sessions. Continue?',
      confirmText: 'ACTIVATE EMERGENCY PROTOCOL',
      onConfirm: async () => {
        await apiCall('/emergency/panic', 'POST');
        setShowConfirmation(null);
      }
    });
  };

  const handleKillAll = () => {
    setShowConfirmation({
      action: 'kill-all',
      title: '⚠️ TERMINATE ALL SESSIONS',
      message: 'This will kill ALL active sessions except critical system processes. This action cannot be undone.',
      confirmText: 'TERMINATE ALL SESSIONS',
      onConfirm: async () => {
        await apiCall('/emergency/kill-all', 'POST', { preserveCritical: true });
        setShowConfirmation(null);
      }
    });
  };

  // Session Controls
  const killSession = (sessionId) => {
    setShowConfirmation({
      action: 'kill-session',
      title: '🔥 TERMINATE SESSION',
      message: `Kill session ${sessionId}? This will stop the session immediately.`,
      confirmText: 'TERMINATE SESSION',
      onConfirm: async () => {
        await apiCall(`/sessions/kill/${sessionId}`, 'POST', { reason: 'Executive termination' });
        setShowConfirmation(null);
      }
    });
  };

  const killExpensiveSessions = () => {
    setShowConfirmation({
      action: 'kill-expensive',
      title: '💸 TERMINATE EXPENSIVE SESSIONS',
      message: 'Kill all sessions costing more than $10? This will help control budget burn.',
      confirmText: 'TERMINATE EXPENSIVE SESSIONS',
      onConfirm: async () => {
        await apiCall('/sessions/kill-expensive', 'POST', { threshold: 10.0 });
        setShowConfirmation(null);
      }
    });
  };

  // Financial Controls
  const enforceBudgetLimits = async () => {
    await apiCall('/financial/enforce-limits', 'POST');
  };

  // Calculate financial metrics
  const financialMetrics = {
    dailySpend: status.financial.daily_spend || 0,
    hourlyRate: status.financial.hourly_rate || 0,
    budgetUsed: status.financial.daily_spend ? (status.financial.daily_spend / 50) * 100 : 0,
    projectedDaily: (status.financial.hourly_rate || 0) * 24
  };

  // Session metrics
  const sessionMetrics = {
    total: status.sessions.length,
    expensive: status.sessions.filter(s => s.cost && parseFloat(s.cost.replace('$', '')) > 10).length,
    running: status.sessions.filter(s => s.status === 'active' || s.status === 'running').length
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-red-400">CEO COMMAND CENTER</h1>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{status.connected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-300 flex items-center">
            <AlertTriangle className="mr-2" />
            EMERGENCY CONTROLS
          </h2>
          <div className="space-y-3">
            <button 
              onClick={handlePanicButton}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg border-2 border-red-400 transition-all duration-200 transform hover:scale-105"
            >
              🚨 PANIC BUTTON
            </button>
            <button 
              onClick={handleKillAll}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
            >
              ⚠️ KILL ALL SESSIONS
            </button>
          </div>
        </div>

        <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-300 flex items-center">
            <DollarSign className="mr-2" />
            FINANCIAL STATUS
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Daily Spend:</span>
              <span className="font-bold">${financialMetrics.dailySpend.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Hourly Rate:</span>
              <span>${financialMetrics.hourlyRate.toFixed(2)}/hr</span>
            </div>
            <div className="flex justify-between">
              <span>Budget Used:</span>
              <span className={financialMetrics.budgetUsed > 80 ? 'text-red-400' : 'text-green-400'}>
                {financialMetrics.budgetUsed.toFixed(1)}%
              </span>
            </div>
            <button 
              onClick={enforceBudgetLimits}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-3"
            >
              ENFORCE LIMITS
            </button>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-300 flex items-center">
            <Activity className="mr-2" />
            SESSION CONTROL
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{sessionMetrics.total}</div>
              <div className="text-sm">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{sessionMetrics.running}</div>
              <div className="text-sm">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{sessionMetrics.expensive}</div>
              <div className="text-sm">Expensive</div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <button 
              onClick={killExpensiveSessions}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              🔥 KILL EXPENSIVE SESSIONS
            </button>
          </div>

          {/* Recent Sessions */}
          <div className="max-h-60 overflow-y-auto">
            {status.sessions.slice(0, 10).map((session, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-700">
                <div className="flex-1 truncate">
                  <div className="text-sm font-mono">{session.id || `Session ${idx + 1}`}</div>
                  <div className="text-xs text-gray-400">{session.status || 'Unknown'}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{session.cost || '$0.00'}</span>
                  <button 
                    onClick={() => killSession(session.id || `session-${idx}`)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                  >
                    KILL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-purple-300 flex items-center">
            <Users className="mr-2" />
            AGENT STATUS
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{status.agents.length}</div>
              <div className="text-sm">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">5</div>
              <div className="text-sm">Available</div>
            </div>
          </div>

          {/* Agent List */}
          <div className="space-y-2">
            {status.agents.slice(0, 5).map((agent, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-700">
                <div>
                  <div className="text-sm font-bold">{agent.id || `Agent ${idx + 1}`}</div>
                  <div className="text-xs text-gray-400">{agent.status || 'Active'}</div>
                </div>
                <button className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">
                  MANAGE
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-green-300 flex items-center">
          <Shield className="mr-2" />
          AUDIT LOG
        </h2>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {auditLog.slice(0, 10).map((entry, idx) => (
            <div key={idx} className="text-xs font-mono border-b border-gray-700 pb-1">
              <span className="text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              {' '}
              <span className="text-yellow-400">{entry.user}</span>
              {' '}
              <span className="text-white">{entry.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border-2 border-red-500">
            <h3 className="text-xl font-bold mb-4 text-red-400">{showConfirmation.title}</h3>
            <p className="mb-6">{showConfirmation.message}</p>
            <div className="flex space-x-3">
              <button 
                onClick={showConfirmation.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex-1"
              >
                {showConfirmation.confirmText}
              </button>
              <button 
                onClick={() => setShowConfirmation(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex-1"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveControlPanel;