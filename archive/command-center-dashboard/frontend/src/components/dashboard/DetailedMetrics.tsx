"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, AlertTriangle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

interface MetricData {
  sessionCosts: Array<{ time: string; cost: number; sessions: number }>;
  apiResponseTimes: Array<{ time: string; avg: number; p99: number }>;
  errorRates: Array<{ time: string; errors: number; total: number }>;
  userActivity: Array<{ time: string; users: number; actions: number }>;
}

export default function DetailedMetrics() {
  const { lastMessage } = useSocket();
  const [metrics, setMetrics] = useState<MetricData>({
    sessionCosts: [
      { time: "12AM", cost: 2.1, sessions: 15 },
      { time: "6AM", cost: 3.2, sessions: 18 },
      { time: "12PM", cost: 4.5, sessions: 25 },
      { time: "6PM", cost: 3.8, sessions: 22 },
      { time: "Now", cost: 3.45, sessions: 23 },
    ],
    apiResponseTimes: [
      { time: "12AM", avg: 120, p99: 180 },
      { time: "6AM", avg: 135, p99: 220 },
      { time: "12PM", avg: 185, p99: 280 },
      { time: "6PM", avg: 165, p99: 245 },
      { time: "Now", avg: 145, p99: 215 },
    ],
    errorRates: [
      { time: "12AM", errors: 2, total: 1000 },
      { time: "6AM", errors: 5, total: 1200 },
      { time: "12PM", errors: 8, total: 1800 },
      { time: "6PM", errors: 3, total: 1500 },
      { time: "Now", errors: 1, total: 1300 },
    ],
    userActivity: [
      { time: "12AM", users: 5, actions: 45 },
      { time: "6AM", users: 8, actions: 92 },
      { time: "12PM", users: 12, actions: 156 },
      { time: "6PM", users: 10, actions: 134 },
      { time: "Now", users: 7, actions: 87 },
    ],
  });

  useEffect(() => {
    if (lastMessage) {
      const parsed = JSON.parse(lastMessage);
      if (parsed.type === "metrics.detailed") {
        setMetrics(parsed.metrics);
      }
    }
  }, [lastMessage]);

  const chartConfig = {
    contentStyle: {
      backgroundColor: "#1e293b",
      border: "none",
      borderRadius: "8px",
      color: "#fff",
      fontSize: "12px",
    },
    itemStyle: { color: "#fff" },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Detailed Metrics
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Costs Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 widget-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Session Costs</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">$3.45/hour</p>
              <p className="text-xs text-slate-500">Current</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.sessionCosts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <Tooltip {...chartConfig} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mt-2">
            <span>Peak: $4.50</span>
            <span>Avg: $3.22</span>
            <span>Target: $3.00</span>
          </div>
        </div>

        {/* API Response Times */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 widget-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">API Response Times</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">145ms</p>
              <p className="text-xs text-slate-500">Avg (Target: &lt;200ms)</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.apiResponseTimes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <Tooltip {...chartConfig} />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 0, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="p99"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#f59e0b", strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-amber-500" />
              <span>P99</span>
            </div>
            <span>SLA: ✅</span>
          </div>
        </div>

        {/* Error Rates */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 widget-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-slate-900">Error Rates</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">0.08%</p>
              <p className="text-xs text-slate-500">Current (Target: &lt;0.1%)</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.errorRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <Tooltip
                  {...chartConfig}
                  formatter={(value, name) => [
                    `${((value as number) / 1000 * 100).toFixed(2)}%`,
                    "Error Rate"
                  ]}
                />
                <Bar
                  dataKey="errors"
                  fill="#ef4444"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-slate-600 mt-2">
            <div className="text-center">
              <p className="text-lg font-semibold text-red-600">8</p>
              <p className="text-xs">Peak Errors</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">0.05%</p>
              <p className="text-xs">24h Avg</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">1,500</p>
              <p className="text-xs">Requests</p>
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 widget-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">User Activity</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">7 active</p>
              <p className="text-xs text-slate-500">87 actions/hour</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.userActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <Tooltip {...chartConfig} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ fill: "#7c3aed", strokeWidth: 0, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="actions"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ fill: "#06b6d4", strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-600" />
              <span>Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-cyan-500" />
              <span>Actions</span>
            </div>
            <span>Peak: 12 users</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}