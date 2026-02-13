"use client";

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mockData = {
    systemHealth: 'OPERATIONAL',
    activeSessions: 42,
    costPerHour: 3.51,
    totalCost: 42.00,
    uptime: '99.8%',
    responseTime: '145ms',
    localAI: {
      model: 'QWEN_2.5_7B',
      status: 'ONLINE',
      savings: '$150-300/mo',
      tasksProcessed: 127
    },
    projects: [
      { name: 'CMD_CENTER', status: 'LIVE', progress: 100, time: '12:25' },
      { name: 'DONOTAGE', status: 'DELIVERED', progress: 100, time: '11:45' },
      { name: 'LM_STUDIO', status: 'ACTIVE', progress: 100, time: '12:09' },
      { name: 'CEO_SIM', status: 'READY', progress: 85, time: '11:30' },
      { name: 'GEO_REBUILD', status: 'HIRING', progress: 75, time: '12:26' },
    ],
    alerts: [
      { type: 'SUCCESS', message: 'GEO_TEAM_ASSEMBLING', time: '12:26' },
      { type: 'SUCCESS', message: 'LOCAL_AI_DEPLOYED', time: '12:09' },
      { type: 'WARNING', message: 'SESSION_COST_$42', time: '12:23' },
    ],
    metrics: {
      totalDeliverables: 5,
      completedToday: 3,
      costsOptimized: '60-80%',
      teamSize: 5
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'DELIVERED': 
      case 'ACTIVE':
        return 'status-green';
      case 'READY':
      case 'HIRING':
        return 'status-yellow';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 font-mono text-xs">
      {/* Compact Header */}
      <div className="flex justify-between items-center mb-3 pb-1 border-b border-border">
        <div className="flex items-center space-x-4">
          <h1 className="text-sm font-medium text-accent">COMMAND_CENTER</h1>
          <div className="text-xs text-muted-foreground">
            OPENCLAW_v1.0
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {currentTime.toISOString().substr(11, 8)} GMT+1
        </div>
      </div>

      <div className="grid grid-cols-16 gap-2">
        {/* System Status - Compact */}
        <div className="col-span-4 dashboard-card">
          <div className="dashboard-subheader mb-2">SYSTEM</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>STATUS</span>
              <span className="status-green">OPERATIONAL</span>
            </div>
            <div className="flex justify-between">
              <span>UPTIME</span>
              <span>{mockData.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span>LATENCY</span>
              <span>{mockData.responseTime}</span>
            </div>
          </div>
        </div>

        {/* Sessions - More Detail */}
        <div className="col-span-4 dashboard-card">
          <div className="dashboard-subheader mb-2">SESSIONS</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>ACTIVE</span>
              <span className="metric-value text-sm">{mockData.activeSessions}</span>
            </div>
            <div className="flex justify-between">
              <span>COST/HR</span>
              <span className="status-yellow">${mockData.costPerHour}</span>
            </div>
            <div className="flex justify-between">
              <span>TOTAL</span>
              <span className="status-red">${mockData.totalCost}</span>
            </div>
          </div>
        </div>

        {/* Local AI - Enhanced */}
        <div className="col-span-4 dashboard-card">
          <div className="dashboard-subheader mb-2">LOCAL_AI</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>MODEL</span>
              <span className="status-green">{mockData.localAI.model}</span>
            </div>
            <div className="flex justify-between">
              <span>STATUS</span>
              <span className="status-green">{mockData.localAI.status}</span>
            </div>
            <div className="flex justify-between">
              <span>SAVINGS</span>
              <span className="status-green">{mockData.localAI.savings}</span>
            </div>
            <div className="flex justify-between">
              <span>TASKS</span>
              <span>{mockData.localAI.tasksProcessed}</span>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="col-span-4 dashboard-card">
          <div className="dashboard-subheader mb-2">TODAY</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>DELIVERED</span>
              <span className="metric-value text-sm">{mockData.metrics.completedToday}</span>
            </div>
            <div className="flex justify-between">
              <span>TOTAL</span>
              <span>{mockData.metrics.totalDeliverables}</span>
            </div>
            <div className="flex justify-between">
              <span>OPTIMIZED</span>
              <span className="status-green">{mockData.metrics.costsOptimized}</span>
            </div>
            <div className="flex justify-between">
              <span>TEAM</span>
              <span>{mockData.metrics.teamSize}</span>
            </div>
          </div>
        </div>

        {/* Projects - Compact Table */}
        <div className="col-span-10 dashboard-card">
          <div className="dashboard-subheader mb-2">PROJECTS</div>
          <table className="compact-table">
            <thead>
              <tr>
                <th className="w-1/3">NAME</th>
                <th className="w-1/4">STATUS</th>
                <th className="w-1/4 text-right">PROGRESS</th>
                <th className="w-1/4 text-right">TIME</th>
              </tr>
            </thead>
            <tbody>
              {mockData.projects.map((project, i) => (
                <tr key={i}>
                  <td className="font-medium">{project.name}</td>
                  <td>
                    <span className={`${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <span>{project.progress}%</span>
                  </td>
                  <td className="text-right text-muted-foreground">
                    {project.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts - Compact */}
        <div className="col-span-6 dashboard-card">
          <div className="dashboard-subheader mb-2">ALERTS</div>
          <div className="space-y-1">
            {mockData.alerts.map((alert, i) => (
              <div key={i} className="flex justify-between">
                <span className={`${
                  alert.type === 'SUCCESS' ? 'status-green' :
                  alert.type === 'WARNING' ? 'status-yellow' :
                  alert.type === 'ERROR' ? 'status-red' :
                  'text-muted-foreground'
                } flex-1 mr-2 text-xs`}>
                  {alert.message}
                </span>
                <span className="text-muted-foreground text-xs">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Footer */}
      <div className="mt-3 pt-1 border-t border-border text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>5_MAJOR_DELIVERABLES_TODAY • COST_OPTIMIZED_60-80% • LOCAL_AI_ACTIVE</span>
          <span>LAST_UPDATE: {currentTime.toTimeString().split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}