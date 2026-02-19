import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const EnhancedDashboard = () => {
  const [socket, setSocket] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [data, setData] = useState({
    bookmarks: { summary: {}, bookmarks: [] },
    todos: { summary: {}, todos: [] },
    projects: { summary: {}, projects: [] },
    intelligence: { systemHealth: {}, alerts: [] },
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

  const apiCall = useCallback(async (endpoint) => {
    try {
      const response = await fetch(`http://100.76.103.90:3001/api${endpoint}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const loadAllData = useCallback(async () => {
    const [bookmarks, todos, projects, intelligence] = await Promise.all([
      apiCall('/enhanced/bookmarks/status'),
      apiCall('/enhanced/todos/status'),
      apiCall('/enhanced/projects/status'),
      apiCall('/enhanced/intelligence/overview')
    ]);

    setData(prev => ({
      ...prev,
      bookmarks: bookmarks.success ? bookmarks : prev.bookmarks,
      todos: todos.success ? todos : prev.todos,
      projects: projects.success ? projects : prev.projects,
      intelligence: intelligence.success ? intelligence.intelligence : prev.intelligence
    }));
  }, [apiCall]);

  const views = {
    overview: 'OVERVIEW',
    bookmarks: 'X BOOKMARKS',
    todos: 'TO-DOS',
    projects: 'PROJECTS',
    intelligence: 'INTELLIGENCE'
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-gray-500 pb-2 mb-4">
        <div className="flex justify-between items-center">
          <span>CEO COMMAND CENTER - ENHANCED</span>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 ${data.connected ? 'bg-white' : 'bg-gray-500'}`}></span>
            <span>{data.connected ? 'ONLINE' : 'OFFLINE'}</span>
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

      {/* Content Area */}
      <div className="min-h-96">
        {activeView === 'overview' && <OverviewView data={data} />}
        {activeView === 'bookmarks' && <BookmarksView data={data.bookmarks} />}
        {activeView === 'todos' && <TodosView data={data.todos} />}
        {activeView === 'projects' && <ProjectsView data={data.projects} />}
        {activeView === 'intelligence' && <IntelligenceView data={data.intelligence} />}
      </div>
    </div>
  );
};

// Overview Dashboard
const OverviewView = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.bookmarks.summary.total || 0}</div>
        <div className="text-xs opacity-70">BOOKMARKS</div>
      </div>
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.todos.summary.total || 0}</div>
        <div className="text-xs opacity-70">TODOS</div>
      </div>
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.projects.summary.active || 0}</div>
        <div className="text-xs opacity-70">ACTIVE PROJECTS</div>
      </div>
      <div className="border border-gray-500 p-3">
        <div className="text-lg">{data.intelligence.alerts?.length || 0}</div>
        <div className="text-xs opacity-70">ALERTS</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">RECENT BOOKMARKS</div>
        {data.bookmarks.bookmarks?.slice(0, 5).map((bookmark, idx) => (
          <div key={idx} className="text-xs mb-1 truncate">
            {bookmark.title} ({bookmark.engagement} engagement)
          </div>
        ))}
      </div>
      
      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">HIGH PRIORITY TODOS</div>
        {data.todos.todos?.filter(t => t.priority === 'high').slice(0, 5).map((todo, idx) => (
          <div key={idx} className="text-xs mb-1 truncate">
            {todo.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// X Bookmarks View
const BookmarksView = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-lg">{data.summary.total || 0}</div>
        <div className="text-xs opacity-70">TOTAL</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.analyzed || 0}</div>
        <div className="text-xs opacity-70">ANALYZED</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.blocked || 0}</div>
        <div className="text-xs opacity-70">BLOCKED</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.highPriority || 0}</div>
        <div className="text-xs opacity-70">HIGH PRIORITY</div>
      </div>
    </div>

    <div className="border border-gray-500 p-2">
      <div className="border-b border-gray-500 pb-1 mb-2 text-xs">BOOKMARK RESEARCH PIPELINE</div>
      <div className="space-y-1">
        {data.bookmarks?.map((bookmark, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-700 pb-1">
            <div className="flex-1 truncate">{bookmark.title}</div>
            <div className="flex items-center space-x-2">
              <span>{bookmark.engagement}</span>
              <span className={bookmark.status === 'analyzed' ? 'text-white' : 'text-gray-500'}>
                {bookmark.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// To-Dos View
const TodosView = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-lg">{data.summary.high || 0}</div>
        <div className="text-xs opacity-70">HIGH PRIORITY</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.medium || 0}</div>
        <div className="text-xs opacity-70">MEDIUM</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.completed || 0}</div>
        <div className="text-xs opacity-70">COMPLETED</div>
      </div>
    </div>

    <div className="border border-gray-500 p-2">
      <div className="border-b border-gray-500 pb-1 mb-2 text-xs">ACTIVE TASKS</div>
      <div className="space-y-1">
        {data.todos?.map((todo, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <div className="flex-1">
              <span className={`mr-2 ${todo.priority === 'high' ? 'text-white' : 'text-gray-500'}`}>
                [{todo.priority.toUpperCase()}]
              </span>
              {todo.text}
            </div>
            <div className="text-xs opacity-70">{todo.source}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Projects View
const ProjectsView = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-lg">{data.summary.total || 0}</div>
        <div className="text-xs opacity-70">TOTAL</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.active || 0}</div>
        <div className="text-xs opacity-70">ACTIVE</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.completed || 0}</div>
        <div className="text-xs opacity-70">COMPLETED</div>
      </div>
      <div>
        <div className="text-lg">{data.summary.planned || 0}</div>
        <div className="text-xs opacity-70">PLANNED</div>
      </div>
    </div>

    <div className="border border-gray-500 p-2">
      <div className="border-b border-gray-500 pb-1 mb-2 text-xs">PROJECTS IN PROCESS</div>
      <div className="space-y-2">
        {data.projects?.map((project, idx) => (
          <div key={idx} className="border border-gray-700 p-2">
            <div className="flex justify-between items-center mb-1">
              <div className="font-bold text-sm">{project.title}</div>
              <div className="text-xs">
                <span className={project.priority === 'high' ? 'text-white' : 'text-gray-500'}>
                  [{project.priority.toUpperCase()}]
                </span>
              </div>
            </div>
            <div className="text-xs opacity-70 mb-1">
              Status: {project.status.toUpperCase()} | Files: {project.fileCount} | Progress: {project.progress}%
            </div>
            <div className="bg-gray-800 h-1">
              <div 
                className="bg-white h-1" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Intelligence View
const IntelligenceView = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">SYSTEM HEALTH</div>
        <div className="text-xs space-y-1">
          <div>Uptime: {Math.floor((data.systemHealth?.uptime || 0) / 3600)}h {Math.floor(((data.systemHealth?.uptime || 0) % 3600) / 60)}m</div>
          <div>Memory: {Math.round((data.systemHealth?.memory?.heapUsed || 0) / 1024 / 1024)}MB used</div>
          <div>Connections: {data.systemHealth?.activeConnections || 0}</div>
        </div>
      </div>

      <div className="border border-gray-500 p-3">
        <div className="border-b border-gray-500 pb-1 mb-2 text-xs">PREDICTIONS</div>
        <div className="text-xs space-y-1">
          <div>Daily Cost: {data.predictions?.dailyCostTrend || 'Unknown'}</div>
          <div>Session Growth: {data.predictions?.sessionGrowth || 'Unknown'}</div>
          <div>Next Maintenance: {data.predictions?.nextMaintenance ? new Date(data.predictions.nextMaintenance).toLocaleDateString() : 'N/A'}</div>
        </div>
      </div>
    </div>

    <div className="border border-gray-500 p-2">
      <div className="border-b border-gray-500 pb-1 mb-2 text-xs">ACTIVE ALERTS</div>
      <div className="space-y-1">
        {data.alerts?.map((alert, idx) => (
          <div key={idx} className="text-xs border-b border-gray-700 pb-1">
            <span className={`mr-2 ${alert.priority === 'high' ? 'text-white' : 'text-gray-500'}`}>
              [{alert.priority?.toUpperCase()}]
            </span>
            {alert.message}
            <div className="text-xs opacity-50 mt-1">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EnhancedDashboard;