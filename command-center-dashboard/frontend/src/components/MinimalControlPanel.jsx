import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const MinimalControlPanel = () => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState({
    sessions: [],
    financial: { daily_spend: 0, hourly_rate: 0 },
    connected: false
  });
  const [showConfirm, setShowConfirm] = useState(null);

  useEffect(() => {
    const newSocket = io('http://100.76.103.90:3001');
    
    newSocket.on('connect', () => {
      setStatus(prev => ({ ...prev, connected: true }));
      newSocket.emit('request_status_update');
    });

    newSocket.on('status_update', (data) => {
      setStatus(prev => ({ ...prev, ...data }));
    });

    setSocket(newSocket);

    const interval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('request_status_update');
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  const apiCall = useCallback(async (endpoint, method = 'GET', body = null) => {
    try {
      const response = await fetch(`http://100.76.103.90:3001/api${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      
      const result = await response.json();
      
      if (socket) {
        socket.emit('request_status_update');
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [socket]);

  const confirm = (action, title, callback) => {
    setShowConfirm({ action, title, callback });
  };

  const execute = async (callback) => {
    await callback();
    setShowConfirm(null);
  };

  // Calculate metrics
  const totalSessions = status.sessions.length;
  const expensiveSessions = status.sessions.filter(s => 
    s.cost && parseFloat(s.cost.replace('$', '')) > 10
  ).length;
  const dailySpend = status.financial.daily_spend || 0;
  const hourlyRate = status.financial.hourly_rate || 0;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-gray-500 pb-2 mb-4">
        <div className="flex justify-between items-center">
          <span>CEO COMMAND CENTER</span>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 ${status.connected ? 'bg-white' : 'bg-gray-500'}`}></span>
            <span>{status.connected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-4 gap-4 mb-4 text-center">
        <div>
          <div className="text-lg">{totalSessions}</div>
          <div className="text-xs opacity-70">SESSIONS</div>
        </div>
        <div>
          <div className="text-lg">{expensiveSessions}</div>
          <div className="text-xs opacity-70">EXPENSIVE</div>
        </div>
        <div>
          <div className="text-lg">${dailySpend.toFixed(2)}</div>
          <div className="text-xs opacity-70">TODAY</div>
        </div>
        <div>
          <div className="text-lg">${hourlyRate.toFixed(2)}</div>
          <div className="text-xs opacity-70">PER HOUR</div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2 mb-4">
        <button 
          onClick={() => confirm('PANIC', 'EMERGENCY SHUTDOWN ALL SYSTEMS?', 
            () => apiCall('/emergency/panic', 'POST'))}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-white text-white py-2 px-4 transition-colors"
        >
          [PANIC] EMERGENCY SHUTDOWN
        </button>
        
        <button 
          onClick={() => confirm('KILL_EXPENSIVE', 'TERMINATE ALL EXPENSIVE SESSIONS?', 
            () => apiCall('/sessions/kill-expensive', 'POST', { threshold: 10.0 }))}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-500 py-2 px-4 transition-colors"
        >
          [KILL] EXPENSIVE SESSIONS (&gt;$10)
        </button>
        
        <button 
          onClick={() => confirm('KILL_ALL', 'TERMINATE ALL NON-CRITICAL SESSIONS?', 
            () => apiCall('/emergency/kill-all', 'POST', { preserveCritical: true }))}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-500 py-2 px-4 transition-colors"
        >
          [KILL] ALL SESSIONS
        </button>
        
        <button 
          onClick={() => apiCall('/financial/enforce-limits', 'POST')}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-500 py-2 px-4 transition-colors"
        >
          [ENFORCE] BUDGET LIMITS
        </button>
      </div>

      {/* Session List */}
      <div className="border border-gray-500 p-2">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">
          ACTIVE SESSIONS ({totalSessions})
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {status.sessions.slice(0, 10).map((session, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <div className="font-mono truncate flex-1">
                {session.id ? session.id.substring(0, 12) + '...' : `SESSION-${idx + 1}`}
              </div>
              <div className="flex items-center space-x-2">
                <span>{session.cost || '$0.00'}</span>
                <button 
                  onClick={() => confirm('KILL_SESSION', `TERMINATE ${session.id}?`, 
                    () => apiCall(`/sessions/kill/${session.id || `session-${idx}`}`, 'POST'))}
                  className="bg-gray-900 hover:bg-gray-700 text-white px-1 text-xs border border-gray-500"
                >
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="border border-gray-500 bg-black p-4 max-w-md w-full mx-4">
            <div className="mb-4">
              <div className="text-white mb-2">[CONFIRM]</div>
              <div>{showConfirm.title}</div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => execute(showConfirm.callback)}
                className="flex-1 bg-gray-900 hover:bg-gray-700 border border-white text-white py-2 text-sm"
              >
                EXECUTE
              </button>
              <button 
                onClick={() => setShowConfirm(null)}
                className="flex-1 bg-gray-900 hover:bg-gray-700 border border-gray-500 py-2 text-sm"
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

export default MinimalControlPanel;