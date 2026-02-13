import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const EnhancedDashboardV2 = () => {
  const [socket, setSocket] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [showConfirm, setShowConfirm] = useState(null);
  const [data, setData] = useState({
    bookmarks: { summary: {}, bookmarks: [] },
    todos: { summary: {}, todos: [] },
    projects: { summary: {}, projects: [] },
    meetings: { summary: {}, meetings: [] },
    intelligence: { systemHealth: {}, alerts: [], session: {}, activity: {} },
    connected: false
  });

  useEffect(() => {
    const newSocket = io('http://100.76.103.90:3001');
    
    newSocket.on('connect', () => {
      setData(prev => ({ ...prev, connected: true }));
      loadAllData();
    });

    setSocket(newSocket);

    const interval = setInterval(() => {
      if (newSocket.connected) {
        loadAllData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`http://100.76.103.90:3001/api/enhanced${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const loadAllData = useCallback(async () => {
    const [todos, projects, meetings, intelligence] = await Promise.all([
      apiCall('/todos/status'),
      apiCall('/projects/status'),
      apiCall('/meetings/status'),
      apiCall('/intelligence/live')
    ]);

    setData(prev => ({
      ...prev,
      todos: todos.success ? todos : prev.todos,
      projects: projects.success ? projects : prev.projects,
      meetings: meetings.success ? meetings : prev.meetings,
      intelligence: intelligence.success ? intelligence.intelligence : prev.intelligence
    }));
  }, [apiCall]);

  // DESTRUCTIVE ACTIONS
  const completeTodo = async (todoId) => {
    const result = await apiCall(`/todos/${todoId}/complete`, { method: 'POST' });
    if (result.success) {
      loadAllData(); // Refresh
      alert(`✓ Todo completed and updated in source file`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const killProject = async (projectId) => {
    if (!showConfirm || showConfirm.action !== 'kill' || showConfirm.id !== projectId) {
      setShowConfirm({ action: 'kill', id: projectId, name: projectId });
      return;
    }

    const result = await apiCall(`/projects/${projectId}/kill`, {
      method: 'DELETE',
      body: { confirm: true }
    });

    if (result.success) {
      loadAllData();
      setShowConfirm(null);
      alert(`🗑️ Project "${projectId}" has been completely destroyed`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const archiveProject = async (projectId) => {
    const result = await apiCall(`/projects/${projectId}/archive`, { method: 'POST' });
    if (result.success) {
      loadAllData();
      alert(`📦 Project "${projectId}" has been archived`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const openFile = (path) => {
    // For development - would integrate with system file opener
    alert(`Opening: ${path}`);
  };

  const views = {
    overview: 'OVERVIEW',
    todos: 'TO-DOS',
    projects: 'PROJECTS',
    meetings: 'MEETINGS',
    intelligence: 'LIVE INTEL'
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-gray-500 pb-2 mb-4">
        <div className="flex justify-between items-center">
          <span>CEO COMMAND CENTER - REAL DATA INTEGRATION</span>
          <div className="flex items-center space-x-4">
            <span className="text-xs">INFINITELY USEFUL MODE</span>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 ${data.connected ? 'bg-white' : 'bg-gray-500'}`}></span>
              <span>{data.connected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        {Object.entries(views).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`px-3 py-1 border transition-colors whitespace-nowrap ${
              activeView === key 
                ? 'bg-white text-black border-white' 
                : 'bg-black text-white border-gray-500 hover:border-white'
            }`}
          >
            [{label}]
          </button>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="border border-red-500 bg-black p-4 max-w-md">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️ DESTRUCTIVE ACTION</div>
              <div className="mb-4">
                Are you sure you want to <strong>{showConfirm.action.toUpperCase()}</strong> project:<br/>
                <span className="text-white font-bold">{showConfirm.name}</span>
              </div>
              <div className="flex space-x-2 justify-center">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="px-3 py-1 border border-gray-500 text-gray-300 hover:border-white hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (showConfirm.action === 'kill') {
                      killProject(showConfirm.id);
                    }
                  }}
                  className="px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black"
                >
                  CONFIRM {showConfirm.action.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-96">
        {activeView === 'overview' && <OverviewView data={data} />}
        {activeView === 'todos' && <TodosView data={data.todos} onComplete={completeTodo} onOpenFile={openFile} />}
        {activeView === 'projects' && <ProjectsView data={data.projects} onKill={killProject} onArchive={archiveProject} onOpenFile={openFile} />}
        {activeView === 'meetings' && <MeetingsView data={data.meetings} onOpenFile={openFile} />}
        {activeView === 'intelligence' && <IntelligenceView data={data.intelligence} />}
      </div>
    </div>
  );
};

// Enhanced Overview with Real Data
const OverviewView = ({ data }) => (
  <div className="space-y-4">
    {/* Key Metrics */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.todos.summary.total || 0}</div>
        <div className="text-xs opacity-70">TODOS</div>
      </div>
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.projects.summary.active || 0}</div>
        <div className="text-xs opacity-70">ACTIVE PROJECTS</div>
      </div>
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.meetings.summary.thisWeek || 0}</div>
        <div className="text-xs opacity-70">MEETINGS THIS WEEK</div>
      </div>
      <div className="border border-gray-500 p-3">
        <div className="text-lg">${data.intelligence.session?.estimatedCost || '0.00'}</div>
        <div className="text-xs opacity-70">SESSION COST</div>
      </div>
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.intelligence.alerts?.length || 0}</div>
        <div className="text-xs opacity-70">ACTIVE ALERTS</div>
      </div>
    </div>

    {/* Live Intelligence Summary */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">HIGH PRIORITY TODOS</div>
        {data.todos.todos?.filter(t => t.priority === 'high').slice(0, 5).map((todo, idx) => (
          <div key={idx} className="text-xs mb-1 truncate">
            [{todo.type.toUpperCase()}] {todo.text}
          </div>
        ))}
      </div>
      
      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">RECENT MEETINGS</div>
        {data.meetings.meetings?.slice(0, 5).map((meeting, idx) => (
          <div key={idx} className="text-xs mb-1 truncate">
            {meeting.title} ({meeting.decisions} decisions)
          </div>
        ))}
      </div>

      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">SYSTEM STATUS</div>
        <div className="text-xs space-y-1">
          <div>Tokens: {data.intelligence.session?.tokensUsed || 0}</div>
          <div>API Calls: {data.intelligence.session?.apiCalls || 0}</div>
          <div>Uptime: {Math.floor((data.intelligence.session?.duration || 0) / 60)}m</div>
          <div>Response: {data.intelligence.activity?.avgResponseTime || 0}ms</div>
        </div>
      </div>
    </div>

    {/* Active Alerts */}
    {data.intelligence.alerts?.length > 0 && (
      <div className="border border-yellow-500 p-3">
        <div className="border-b border-yellow-500 pb-1 mb-2 text-xs text-yellow-500">⚠️ ACTIVE ALERTS</div>
        <div className="space-y-1">
          {data.intelligence.alerts.map((alert, idx) => (
            <div key={idx} className="text-xs">
              <span className={`mr-2 ${alert.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                [{alert.priority?.toUpperCase()}]
              </span>
              {alert.message}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Enhanced To-Dos with Real Data and Actions
const TodosView = ({ data, onComplete, onOpenFile }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-lg">{data.summary.high || 0}</div>
        <div className="text-xs opacity-70">HIGH PRIORITY</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.memory || 0}</div>
        <div className="text-xs opacity-70">FROM MEMORY</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.projects || 0}</div>
        <div className="text-xs opacity-70">FROM PROJECTS</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.completed || 0}</div>
        <div className="text-xs opacity-70">COMPLETED</div>
      </div>
    </div>

    <div className="border border-gray-500 p-2">
      <div className="border-b border-gray-500 pb-1 mb-2 text-xs">ACTIVE TASKS WITH ACTIONS</div>
      <div className="space-y-2">
        {data.todos?.map((todo, idx) => (
          <div key={idx} className="border border-gray-700 p-2">
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1">
                <span className={`mr-2 ${todo.priority === 'high' ? 'text-white' : 'text-gray-500'}`}>
                  [{todo.priority.toUpperCase()}]
                </span>
                <span className="text-xs opacity-70 mr-2">[{todo.type.toUpperCase()}]</span>
                {todo.text}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => onOpenFile(todo.source)}
                  className="text-xs px-2 py-1 border border-gray-500 hover:border-white"
                  title="Open source file"
                >
                  OPEN
                </button>
                <button
                  onClick={() => onComplete(todo.id)}
                  className="text-xs px-2 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black"
                  title="Mark as completed"
                >
                  COMPLETE
                </button>
              </div>
            </div>
            <div className="text-xs opacity-50">
              {todo.source} (line {todo.line})
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Enhanced Projects with Destruction Controls
const ProjectsView = ({ data, onKill, onArchive, onOpenFile }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-5 gap-4 text-center">
      <div>
        <div className="text-lg">{data.summary.total || 0}</div>
        <div className="text-xs opacity-70">TOTAL</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.active || 0}</div>
        <div className="text-xs opacity-70">ACTIVE</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.destructible || 0}</div>
        <div className="text-xs opacity-70">DESTRUCTIBLE</div>
      </div>
      <div>
        <div className="text-lg">{Math.round((data.summary.totalSize || 0) / 1024)}MB</div>
        <div className="text-xs opacity-70">TOTAL SIZE</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.stalled || 0}</div>
        <div className="text-xs opacity-70">STALLED</div>
      </div>
    </div>

    <div className="border border-gray-500 p-2">
      <div className="border-b border-gray-500 pb-1 mb-2 text-xs">PROJECTS WITH DESTRUCTION CONTROLS</div>
      <div className="space-y-3">
        {data.projects?.map((project, idx) => (
          <div key={idx} className="border border-gray-700 p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-sm">{project.title}</div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${project.priority === 'high' ? 'text-white' : 'text-gray-500'}`}>
                  [{project.priority.toUpperCase()}]
                </span>
                <span className={`text-xs ${
                  project.destructionRisk === 'high' ? 'text-red-500' : 
                  project.destructionRisk === 'medium' ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  RISK: {project.destructionRisk.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="text-xs opacity-70 mb-2">
              Status: {project.status.toUpperCase()} | 
              Files: {project.fileCount} | 
              Size: {Math.round(project.totalSize / 1024)}MB | 
              Git: {project.gitStatus || 'N/A'}
            </div>
            
            <div className="bg-gray-800 h-1 mb-2">
              <div 
                className="bg-white h-1" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => onOpenFile(project.path)}
                className="text-xs px-2 py-1 border border-gray-500 hover:border-white"
              >
                OPEN PROJECT
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onArchive(project.id)}
                  className="text-xs px-2 py-1 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                  disabled={!project.canDestroy}
                >
                  ARCHIVE
                </button>
                <button
                  onClick={() => onKill(project.id)}
                  className={`text-xs px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black ${
                    !project.canDestroy ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!project.canDestroy}
                >
                  KILL PROJECT
                </button>
              </div>
            </div>
            
            {project.lastCommit && (
              <div className="text-xs opacity-50 mt-1">
                Last commit: {project.lastCommit}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Meeting Notes with Direct Links
const MeetingsView = ({ data, onOpenFile }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-lg">{data.summary.total || 0}</div>
        <div className="text-xs opacity-70">TOTAL MEETINGS</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.thisWeek || 0}</div>
        <div className="text-xs opacity-70">THIS WEEK</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.withDecisions || 0}</div>
        <div className="text-xs opacity-70">WITH DECISIONS</div>
      </div>
      <div>
        <div className="text-lg">{Math.round((data.summary.totalSize || 0) / 1024)}MB</div>
        <div className="text-xs opacity-70">TOTAL SIZE</div>
      </div>
    </div>

    <div className="border border-gray-500 p-2">
      <div className="border-b border-gray-500 pb-1 mb-2 text-xs">MEETING NOTES WITH DIRECT ACCESS</div>
      <div className="space-y-2">
        {data.meetings?.map((meeting, idx) => (
          <div key={idx} className="border border-gray-700 p-2">
            <div className="flex justify-between items-center mb-1">
              <div className="font-bold text-sm">{meeting.title}</div>
              <button
                onClick={() => onOpenFile(meeting.path)}
                className="text-xs px-2 py-1 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black"
              >
                OPEN MEETING NOTES
              </button>
            </div>
            
            <div className="text-xs opacity-70 mb-1">
              {new Date(meeting.lastModified).toLocaleString()} | 
              {meeting.size}KB | 
              {meeting.attendees.length} attendees | 
              {meeting.decisions} decisions
            </div>
            
            <div className="text-xs opacity-60 truncate">
              {meeting.preview}
            </div>
            
            <div className="text-xs mt-1">
              Attendees: {meeting.attendees.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Live Intelligence View
const IntelligenceView = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">LIVE SESSION DATA</div>
        <div className="text-xs space-y-1">
          <div>Current Model: {data.session?.currentModel || 'Unknown'}</div>
          <div>Tokens Used: {(data.session?.tokensUsed || 0).toLocaleString()}</div>
          <div>Estimated Cost: ${data.session?.estimatedCost || '0.00'}</div>
          <div>API Calls: {data.session?.apiCalls || 0}</div>
          <div>Duration: {Math.floor((data.session?.duration || 0) / 60)}m {(data.session?.duration || 0) % 60}s</div>
        </div>
      </div>

      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">ACTIVITY METRICS</div>
        <div className="text-xs space-y-1">
          <div>Last 5min Activity: {data.activity?.last5Min || 0} actions</div>
          <div>Peak Hour Activity: {data.activity?.peakHour || 0} actions</div>
          <div>Avg Response Time: {data.activity?.avgResponseTime || 0}ms</div>
          <div>Error Rate: {data.activity?.errorRate || 0}%</div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">PREDICTIONS</div>
        <div className="text-xs space-y-1">
          <div>Daily Cost Projection: ${data.predictions?.dailyCostProjection || '0.00'}</div>
          <div>Peak Usage Time: {data.predictions?.peakUsageTime || 'Unknown'}</div>
          <div>Session End Estimate: {data.predictions?.sessionEndEstimate ? 
            new Date(data.predictions.sessionEndEstimate).toLocaleTimeString() : 'Unknown'}</div>
        </div>
      </div>

      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">OPERATIONAL ALERTS</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {data.alerts?.map((alert, idx) => (
            <div key={idx} className="text-xs border-b border-gray-700 pb-1">
              <span className={`mr-2 ${
                alert.priority === 'high' ? 'text-red-500' : 
                alert.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
              }`}>
                [{alert.priority?.toUpperCase()}]
              </span>
              {alert.message}
              <div className="text-xs opacity-50">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )) || <div className="text-xs opacity-50">No alerts</div>}
        </div>
      </div>
    </div>
  </div>
);

export default EnhancedDashboardV2;