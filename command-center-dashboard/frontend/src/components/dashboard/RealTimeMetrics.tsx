"use client";

import { motion } from "framer-motion";
import { Activity, Clock, DollarSign, Users, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RealTimeData {
  activeSessions: number;
  costPerHour: number;
  hourlyData: { time: string; sessions: number; cost: number }[];
}

export default function RealTimeMetrics() {
  const { lastMessage } = useSocket();
  const [data, setData] = useState<RealTimeData>({
    activeSessions: 23,
    costPerHour: 3.45,
    hourlyData: [
      { time: "1h ago", sessions: 18, cost: 2.8 },
      { time: "50m", sessions: 20, cost: 3.1 },
      { time: "40m", sessions: 22, cost: 3.3 },
      { time: "30m", sessions: 21, cost: 3.2 },
      { time: "20m", sessions: 23, cost: 3.4 },
      { time: "10m", sessions: 24, cost: 3.5 },
      { time: "Now", sessions: 23, cost: 3.45 },
    ],
  });

  useEffect(() => {
    if (lastMessage) {
      const parsed = JSON.parse(lastMessage);
      if (parsed.type === "metrics.realtime") {
        setData(parsed.data);
      }
    }
  }, [lastMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl border border-slate-200 p-6 widget-hover"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Real-Time Metrics</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Active Sessions */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Sessions</p>
              <p className="text-2xl font-bold text-slate-900">
                {data.activeSessions}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600">
              <span className="text-sm font-medium">+15%</span>
            </div>
            <p className="text-xs text-slate-500">vs last hour</p>
          </div>
        </div>

        {/* Cost Per Hour */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Cost Per Hour</p>
              <p className="text-2xl font-bold text-slate-900">
                ${data.costPerHour.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-600">
              <span className="text-sm font-medium">+$0.45</span>
            </div>
            <p className="text-xs text-slate-500">vs budget</p>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-32 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.hourlyData}>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 0, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">21.2</p>
            <p className="text-xs text-slate-500">Avg Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">24</p>
            <p className="text-xs text-slate-500">Peak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">18</p>
            <p className="text-xs text-slate-500">Min</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
