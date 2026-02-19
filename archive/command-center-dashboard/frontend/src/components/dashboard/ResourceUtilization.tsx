"use client";

import { motion } from "framer-motion";
import { Cpu, HardDrive, Wifi, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

interface ResourceData {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percentage: number };
  storage: { used: number; total: number; percentage: number };
  apiCalls: { current: number; limit: number };
}

export default function ResourceUtilization() {
  const { lastMessage } = useSocket();
  const [resources, setResources] = useState<ResourceData>({
    cpu: { usage: 65, cores: 8 },
    memory: { used: 7.8, total: 10, percentage: 78 },
    storage: { used: 2.3, total: 5, percentage: 46 },
    apiCalls: { current: 1200, limit: 5000 },
  });

  useEffect(() => {
    if (lastMessage) {
      const parsed = JSON.parse(lastMessage);
      if (parsed.type === "resources.update") {
        setResources(parsed.resources);
      }
    }
  }, [lastMessage]);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-amber-600";
    return "text-green-600";
  };

  const getUsageBg = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-xl border border-slate-200 p-6 widget-hover"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Resource Utilization</h3>
        </div>
      </div>

      <div className="space-y-5">
        {/* CPU */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">CPU</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(resources.cpu.usage)}`}>
              {resources.cpu.usage}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${resources.cpu.usage}%` }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className={`h-full rounded-full ${getUsageBg(resources.cpu.usage)}`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{resources.cpu.cores} cores</p>
        </div>

        {/* Memory */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Memory</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(resources.memory.percentage)}`}>
              {resources.memory.percentage}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${resources.memory.percentage}%` }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className={`h-full rounded-full ${getUsageBg(resources.memory.percentage)}`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {resources.memory.used}GB / {resources.memory.total}GB
          </p>
        </div>

        {/* Storage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Storage</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(resources.storage.percentage)}`}>
              {resources.storage.percentage}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${resources.storage.percentage}%` }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className={`h-full rounded-full ${getUsageBg(resources.storage.percentage)}`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {resources.storage.used}TB / {resources.storage.total}TB
          </p>
        </div>

        {/* API Calls */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">API Calls / min</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {resources.apiCalls.current.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(resources.apiCalls.current / resources.apiCalls.limit) * 100}%` }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="h-full rounded-full bg-blue-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {((resources.apiCalls.current / resources.apiCalls.limit) * 100).toFixed(0)}% of limit
          </p>
        </div>
      </div>
    </motion.div>
  );
}
