import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { fetchDashboardStats } from '../services/api';

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];

function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats
  });

  // Sample data for demo
  const sampleStats = {
    totalUsers: 15234,
    activeUsers: 8421,
    newUsersToday: 127,
    totalMatches: 42891,
    messagesExchanged: 892341,
    activeSubscriptions: 3421,
    revenue: 85250,
    conversionRate: 22.4
  };

  const userGrowth = [
    { date: 'Mon', users: 120 },
    { date: 'Tue', users: 145 },
    { date: 'Wed', users: 132 },
    { date: 'Thu', users: 167 },
    { date: 'Fri', users: 189 },
    { date: 'Sat', users: 210 },
    { date: 'Sun', users: 185 }
  ];

  const subscriptionData = [
    { name: 'Basic', value: 45 },
    { name: 'Premium', value: 35 },
    { name: 'VIP', value: 20 }
  ];

  const displayStats = stats || sampleStats;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{displayStats.totalUsers.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-2">+{displayStats.newUsersToday} today</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{displayStats.activeUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">{((displayStats.activeUsers / displayStats.totalUsers) * 100).toFixed(1)}% of total</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Matches</h3>
          <p className="text-3xl font-bold text-pink-600 mt-2">{displayStats.totalMatches.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">Lifetime connections</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">${displayStats.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">{displayStats.activeSubscriptions} active subscriptions</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#ec4899" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {subscriptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {subscriptionData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-gray-600">{entry.name} ({entry.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <span className="text-sm text-gray-600">New user registration</span>
            </div>
            <span className="text-xs text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
              <span className="text-sm text-gray-600">New match created</span>
            </div>
            <span className="text-xs text-gray-400">5 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              <span className="text-sm text-gray-600">Premium subscription purchased</span>
            </div>
            <span className="text-xs text-gray-400">12 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
              <span className="text-sm text-gray-600">Content flagged for review</span>
            </div>
            <span className="text-xs text-gray-400">18 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
