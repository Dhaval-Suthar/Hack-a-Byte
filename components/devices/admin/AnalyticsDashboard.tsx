"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AdminHeader, LoadingSpinner, ErrorDisplay, TabContentWrapper } from "./AdminComponents";

// Import server actions
import { getAnalyticsData, getUserGrowthData, getDeviceStats, getAccessCodeStats } from "@/app/actions/admin";

interface AnalyticsData {
  totalUsers: number;
  totalTeams: number;
  totalAccessCodes: number;
  totalPlayspaces: number;
  totalDevices: number;
  totalEvents: number;
  totalSponsors: number;
  activeUsers: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    memoryUsage: number;
    cpuUsage: number;
  };
}

interface GrowthData {
  userGrowth: Array<{ _id: string; count: number }>;
  teamGrowth: Array<{ _id: string; count: number }>;
  period: { startDate: Date; endDate: Date; days: number };
}

interface DeviceStats {
  deviceStats: Array<{ _id: string; count: number; activeCount: number }>;
  statusStats: Array<{ _id: string; count: number }>;
}

interface AccessCodeStats {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  usageStats: { totalUsage: number; avgUsage: number; maxUsage: number };
}

interface AnalyticsDashboardProps {
  authKey: string;
  onLogout: () => void;
}

export default function AnalyticsDashboard({ authKey, onLogout }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [accessCodeStats, setAccessCodeStats] = useState<AccessCodeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load all analytics data in parallel
      const [analyticsResult, growthResult, deviceResult, accessCodeResult] = await Promise.all([
        getAnalyticsData(authKey),
        getUserGrowthData(authKey, selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90),
        getDeviceStats(authKey),
        getAccessCodeStats(authKey)
      ]);

      // Check for errors
      if (analyticsResult.error) throw new Error(analyticsResult.error);
      if (growthResult.error) throw new Error(growthResult.error);
      if (deviceResult.error) throw new Error(deviceResult.error);
      if (accessCodeResult.error) throw new Error(accessCodeResult.error);

      // Set all data
      setAnalyticsData(analyticsResult as AnalyticsData);
      setGrowthData(growthResult as GrowthData);
      setDeviceStats(deviceResult as DeviceStats);
      setAccessCodeStats(accessCodeResult as AccessCodeStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [authKey, selectedTimeframe]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const StatCard = ({ title, value, change, icon, color }: {
    title: string;
    value: string | number;
    change?: string;
    icon: string;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/30 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <AdminHeader onLogout={onLogout} />
        <div className="container mx-auto px-6 py-8">
          <LoadingSpinner message="Loading analytics data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <AdminHeader onLogout={onLogout} />
        <div className="container mx-auto px-6 py-8">
          <ErrorDisplay error={error} />
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <AdminHeader onLogout={onLogout} />

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-400">Monitor system performance and user activity</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Timeframe:</span>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyber-primary"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-gradient-to-r from-cyber-primary to-cyber-secondary text-white rounded-lg text-sm font-medium"
              >
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={analyticsData.totalUsers.toLocaleString()}
            change="+12%"
            icon="👥"
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard
            title="Active Teams"
            value={analyticsData.totalTeams.toLocaleString()}
            change="+8%"
            icon="🤝"
            color="bg-green-500/20 text-green-400"
          />
          <StatCard
            title="Devices"
            value={analyticsData.totalDevices.toLocaleString()}
            change="+15%"
            icon="💻"
            color="bg-purple-500/20 text-purple-400"
          />
          <StatCard
            title="Events"
            value={analyticsData.totalEvents.toLocaleString()}
            change="+3%"
            icon="📅"
            color="bg-orange-500/20 text-orange-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Health */}
          <TabContentWrapper>
            <h2 className="text-xl font-bold text-white mb-6">System Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    analyticsData.systemHealth.status === 'healthy' ? 'bg-green-400' :
                    analyticsData.systemHealth.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white font-medium">Status</span>
                </div>
                <span className="text-gray-400 capitalize">{analyticsData.systemHealth.status}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <span className="text-white font-medium">Uptime</span>
                <span className="text-gray-400">{analyticsData.systemHealth.uptime}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Memory Usage</span>
                  <span className="text-gray-400">{analyticsData.systemHealth.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyber-primary to-cyber-secondary h-2 rounded-full"
                    style={{ width: `${analyticsData.systemHealth.memoryUsage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">CPU Usage</span>
                  <span className="text-gray-400">{analyticsData.systemHealth.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyber-primary to-cyber-secondary h-2 rounded-full"
                    style={{ width: `${analyticsData.systemHealth.cpuUsage}%` }}
                  />
                </div>
              </div>
            </div>
          </TabContentWrapper>
        </div>

        {/* Additional Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Growth Trends */}
          <TabContentWrapper>
            <h2 className="text-xl font-bold text-white mb-6">Growth Trends</h2>
            {growthData && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">New Users</span>
                    <span className="text-cyber-primary font-bold">
                      +{growthData.userGrowth.reduce((sum, item) => sum + item.count, 0)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Last {growthData.period.days} days
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">New Teams</span>
                    <span className="text-green-400 font-bold">
                      +{growthData.teamGrowth.reduce((sum, item) => sum + item.count, 0)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Last {growthData.period.days} days
                  </div>
                </div>
              </div>
            )}
          </TabContentWrapper>

          {/* Device Statistics */}
          <TabContentWrapper>
            <h2 className="text-xl font-bold text-white mb-6">Device Statistics</h2>
            {deviceStats && (
              <div className="space-y-4">
                {deviceStats.deviceStats.map((device) => (
                  <div key={device._id} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium capitalize">{device._id}</span>
                      <span className="text-purple-400 font-bold">{device.count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Active: {device.activeCount}</span>
                      <span className="text-green-400">
                        {device.count > 0 ? Math.round((device.activeCount / device.count) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabContentWrapper>

          {/* Access Code Statistics */}
          <TabContentWrapper>
            <h2 className="text-xl font-bold text-white mb-6">Access Code Stats</h2>
            {accessCodeStats && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Total Codes</span>
                    <span className="text-indigo-400 font-bold">{accessCodeStats.totalCodes}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {accessCodeStats.activeCodes} active
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Usage Rate</span>
                    <span className="text-orange-400 font-bold">
                      {accessCodeStats.totalCodes > 0 ? Math.round((accessCodeStats.usedCodes / accessCodeStats.totalCodes) * 100) : 0}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {accessCodeStats.usedCodes} used
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Avg Usage</span>
                    <span className="text-teal-400 font-bold">
                      {Math.round(accessCodeStats.usageStats.avgUsage * 10) / 10}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Max: {accessCodeStats.usageStats.maxUsage}
                  </div>
                </div>
              </div>
            )}
          </TabContentWrapper>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div></div> {/* Empty space for layout */}
          <TabContentWrapper>
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {analyticsData.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30"
                >
                  <div className="w-8 h-8 rounded-full bg-cyber-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">
                      {activity.type === 'user' ? '👤' :
                       activity.type === 'team' ? '👥' :
                       activity.type === 'device' ? '💻' : '📝'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabContentWrapper>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <StatCard
            title="Access Codes"
            value={analyticsData.totalAccessCodes.toLocaleString()}
            icon="🔑"
            color="bg-indigo-500/20 text-indigo-400"
          />
          <StatCard
            title="Playspaces"
            value={analyticsData.totalPlayspaces.toLocaleString()}
            icon="🏢"
            color="bg-teal-500/20 text-teal-400"
          />
          <StatCard
            title="Sponsors"
            value={analyticsData.totalSponsors.toLocaleString()}
            icon="🤝"
            color="bg-pink-500/20 text-pink-400"
          />
        </div>
      </div>
    </div>
  );
}
