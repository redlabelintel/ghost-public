"use client";

import { motion } from "framer-motion";
import { FolderKanban, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

interface Project {
  id: string;
  name: string;
  progress: number;
  status: "active" | "completed" | "delayed" | "at_risk";
  week: string;
  totalWeeks: number;
}

export default function ProjectStatus() {
  const { lastMessage } = useSocket();
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Command Center Dashboard",
      progress: 25,
      status: "active",
      week: "Week 1",
      totalWeeks: 4,
    },
    {
      id: "2",
      name: "Crypto Trading Bot",
      progress: 95,
      status: "active",
      week: "95%",
      totalWeeks: 100,
    },
    {
      id: "3",
      name: "Weather Arbitrage System",
      progress: 78,
      status: "active",
      week: "Monitoring",
      totalWeeks: 100,
    },
  ]);

  useEffect(() => {
    if (lastMessage) {
      const parsed = JSON.parse(lastMessage);
      if (parsed.type === "projects.update") {
        setProjects(parsed.projects);
      }
    }
  }, [lastMessage]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "active":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "delayed":
      case "at_risk":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "active":
        return "bg-blue-500";
      case "delayed":
      case "at_risk":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-xl border border-slate-200 p-6 widget-hover"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Project Status</h3>
        </div>
        <span className="text-xs text-slate-500">{projects.length} Active</span>
      </div>

      <div className="space-y-4">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(project.status)}
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    {project.name}
                  </p>
                  <p className="text-xs text-slate-500">{project.week}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {project.progress}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className={`h-full rounded-full ${getStatusColor(
                  project.status
                )}`}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        View All Projects
      </button>
    </motion.div>
  );
}
