"use client";

import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  uptime: string;
  lastCheck: string;
}

interface FinancialSummary {
  revenue: number;
  change: number;
  changePercent: number;
}

interface OperationalKPIs {
  successRate: number;
  target: number;
}

interface AlertSummary {
  critical: number;
  warning: number;
  total: number;
}

export default function ExecutiveOverview() {
  const { lastMessage } = useSocket();
  const [health, setHealth] = useState<SystemHealth>({
    status: "healthy",
    uptime: "99.97%",
    lastCheck: "30s ago",
  });
  const [financial, setFinancial] = useState<FinancialSummary>({
    revenue: 1245000,
    change: 45000,
    changePercent: 3.8,
  });
  const [kpis, setKpis] = useState<OperationalKPIs>({
    successRate: 95.2,
    target: 95,
  });
  const [alerts, setAlerts] = useState<AlertSummary>({
    critical: 0,
    warning: 2,
    total: 2,
  });

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      if (data.type === "executive.overview") {
        setHealth(data.health);
        setFinancial(data.financial);
        setKpis(data.kpis);
        setAlerts(data.alerts);
      }
    }
  }, [lastMessage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-amber-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "critical":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Executive Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className={`rounded-xl border p-5 widget-hover ${getStatusBg(
            health.status
          )}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                System Health
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full ${getStatusColor(
                    health.status
                  )}`}
                />
                <span className="text-2xl font-bold capitalize text-slate-900">
                  {health.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Uptime: {health.uptime}
              </p>
              <p className="text-xs text-slate-500">Last: {health.lastCheck}</p>
            </div>
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <div className="mt-4 flex gap-2">
            {["API", "DB", "Cache", "WS"].map((service) => (
              <div
                key={service}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-8 h-8 rounded-lg bg-white/50 border border-slate-200 flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(health.status)}`} />
                </div>
                <span className="text-xs text-slate-500">{service}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-5 widget-hover"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                Financial Summary
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                ${(financial.revenue / 1000000).toFixed(1)}M
              </p>
              <div className="mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  ${(financial.change / 1000).toFixed(0)}K
                </span>
                <span className="text-sm text-slate-500">
                  ({financial.changePercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Revenue YTD</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: "78%" }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">78% of annual target</p>
        </motion.div>

        {/* Operational KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-5 widget-hover"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                Operational KPIs
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {kpis.successRate}%
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Success Rate
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    kpis.successRate >= kpis.target
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  Target: {kpis.target}%
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "API", value: "99.2%" },
              { label: "Jobs", value: "98.8%" },
              { label: "DB", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-lg p-2">
                <p className="text-lg font-semibold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts & Risks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl border p-5 widget-hover ${
            alerts.critical > 0
              ? "bg-red-50 border-red-200"
              : alerts.warning > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                Alerts & Risks
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {alerts.total}
                </span>
                <span className="text-sm text-slate-600">Issues</span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                alerts.critical > 0
                  ? "bg-red-100"
                  : alerts.warning > 0
                  ? "bg-amber-100"
                  : "bg-green-100"
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${
                  alerts.critical > 0
                    ? "text-red-600"
                    : alerts.warning > 0
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {alerts.critical > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-700 font-medium">
                  {alerts.critical} Critical
                </span>
              </div>
            )}
            {alerts.warning > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-700 font-medium">
                  {alerts.warning} Warning
                </span>
              </div>
            )}
            {alerts.total === 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  All Systems Healthy
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
