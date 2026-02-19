"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info" | "resolved";
  title: string;
  description: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  details?: string;
}

export default function AlertWidget() {
  const { lastMessage } = useSocket();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      type: "warning",
      title: "High Session Cost Detected",
      description: "Session a4b58574 cost $45.20 (150% over budget)",
      timestamp: "5 min ago",
      source: "Cost Monitor",
      acknowledged: false,
    },
    {
      id: "2",
      type: "warning",
      title: "Memory Usage at 78%",
      description: "Primary server memory approaching limit",
      timestamp: "12 min ago",
      source: "System Monitor",
      acknowledged: false,
    },
    {
      id: "3",
      type: "resolved",
      title: "Database Connection Restored",
      description: "Connection pool stabilized after temporary spike",
      timestamp: "25 min ago",
      source: "Database Monitor",
      acknowledged: true,
    },
    {
      id: "4",
      type: "resolved",
      title: "API Rate Limit Reset",
      description: "External API quota refreshed for new hour",
      timestamp: "1 hour ago",
      source: "API Monitor",
      acknowledged: true,
    },
    {
      id: "5",
      type: "resolved",
      title: "Backup Completed Successfully",
      description: "Daily backup completed - 2.3GB archived",
      timestamp: "2 hours ago",
      source: "Backup Service",
      acknowledged: true,
    },
  ]);

  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      const parsed = JSON.parse(lastMessage);
      if (parsed.type === "alerts.update") {
        setAlerts(parsed.alerts);
      }
    }
  }, [lastMessage]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "resolved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAlertBg = (type: string, acknowledged: boolean) => {
    const baseClass = acknowledged ? "bg-slate-50" : "";
    switch (type) {
      case "critical":
        return `${baseClass} border-l-red-500 ${!acknowledged ? "bg-red-50" : ""}`;
      case "warning":
        return `${baseClass} border-l-amber-500 ${!acknowledged ? "bg-amber-50" : ""}`;
      case "info":
        return `${baseClass} border-l-blue-500 ${!acknowledged ? "bg-blue-50" : ""}`;
      case "resolved":
        return `${baseClass} border-l-green-500`;
      default:
        return `${baseClass} border-l-slate-300`;
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const activeAlerts = alerts.filter(alert => alert.type !== "resolved");
  const resolvedAlerts = alerts.filter(alert => alert.type === "resolved");
  const criticalCount = alerts.filter(alert => alert.type === "critical").length;
  const warningCount = alerts.filter(alert => alert.type === "warning").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="bg-white rounded-xl border border-slate-200 widget-hover"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-slate-900">Alerts & Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                {warningCount} Warning
              </span>
            )}
            <button className="p-1 text-slate-400 hover:text-slate-600">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Active Alerts */}
          {activeAlerts.length > 0 ? (
            <>
              {activeAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${getAlertBg(alert.type, alert.acknowledged)} transition-all hover:shadow-sm cursor-pointer`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 text-sm">
                            {alert.title}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{alert.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          Source: {alert.source}
                        </p>
                      </div>
                    </div>
                    {!alert.acknowledged && alert.type !== "resolved" && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                      >
                        ACK
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-slate-900">All Systems Healthy</p>
              <p className="text-sm text-slate-600">No active alerts or issues</p>
            </div>
          )}

          {/* Resolved Alerts Section */}
          {resolvedAlerts.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Resolved ({resolvedAlerts.length})</span>
                <motion.div
                  animate={{ rotate: showResolved ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: showResolved ? "auto" : 0,
                  opacity: showResolved ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3">
                  {resolvedAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${getAlertBg(alert.type, alert.acknowledged)} opacity-75`}
                    >
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-slate-700 text-sm">
                              {alert.title}
                            </h5>
                            <span className="text-xs text-slate-500">
                              {alert.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
          <button className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            View All Alerts
          </button>
          <button className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            Configure
          </button>
        </div>
      </div>
    </motion.div>
  );
}