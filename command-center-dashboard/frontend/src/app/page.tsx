"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Users,
  Settings,
  Menu,
  X,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertCircle,
  Shield,
} from "lucide-react";
import ExecutiveOverview from "@/components/dashboard/ExecutiveOverview";
import RealTimeMetrics from "@/components/dashboard/RealTimeMetrics";
import ProjectStatus from "@/components/dashboard/ProjectStatus";
import ResourceUtilization from "@/components/dashboard/ResourceUtilization";
import DetailedMetrics from "@/components/dashboard/DetailedMetrics";
import AlertWidget from "@/components/dashboard/AlertWidget";
import { useSocket } from "@/hooks/useSocket";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isConnected, lastMessage } = useSocket();

  // Update timestamp on new messages
  useEffect(() => {
    if (lastMessage) {
      setLastUpdate(new Date());
    }
  }, [lastMessage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-navy rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Command Center
              </h1>
            </div>
          </div>

          {/* Center: Connection Status */}
          <div className="hidden md:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse"`} />
            <span className="text-sm text-slate-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Updated {getTimeAgo()}</span>
            </button>
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <div className="w-8 h-8 bg-primary-navy rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">C</span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700">CEO</span>
            </div>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-2">
            {[
              { icon: Zap, label: "Dashboard", active: true },
              { icon: TrendingUp, label: "Analytics", active: false },
              { icon: Users, label: "Team", active: false },
              { icon: AlertCircle, label: "Alerts", active: false },
              { icon: Shield, label: "Security", active: false },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  item.active
                    ? "bg-primary-navy text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              className="relative w-64 h-full bg-white border-r border-slate-200"
            >
              <nav className="p-4 space-y-2">
                {[
                  { icon: Zap, label: "Dashboard", active: true },
                  { icon: TrendingUp, label: "Analytics", active: false },
                  { icon: Users, label: "Team", active: false },
                  { icon: AlertCircle, label: "Alerts", active: false },
                  { icon: Shield, label: "Security", active: false },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      item.active
                        ? "bg-primary-navy text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </div>
        )}

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Executive Overview */}
            <ExecutiveOverview />

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <RealTimeMetrics />
              <ProjectStatus />
              <ResourceUtilization />
            </div>

            {/* Detailed Metrics */}
            <DetailedMetrics />

            {/* Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AlertWidget />
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-slate-200 p-6 h-full">
                  <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      "Export Dashboard Data",
                      "View System Logs",
                      "Configure Alerts",
                      "Manage Users",
                    ].map((action) => (
                      <button
                        key={action}
                        className="w-full text-left px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
