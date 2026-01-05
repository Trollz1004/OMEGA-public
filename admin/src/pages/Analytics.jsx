import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

function Analytics() {
  const userGrowth = [
    { month: 'Jan', users: 12500, newUsers: 1250 },
    { month: 'Feb', users: 14200, newUsers: 1700 },
    { month: 'Mar', users: 16800, newUsers: 2600 },
    { month: 'Apr', users: 19200, newUsers: 2400 },
    { month: 'May', users: 22100, newUsers: 2900 },
    { month: 'Jun', users: 25800, newUsers: 3700 }
  ];

  const engagement = [
    { day: 'Mon', swipes: 45000, matches: 1200, messages: 8500 },
    { day: 'Tue', swipes: 52000, matches: 1450, messages: 9200 },
    { day: 'Wed', swipes: 48000, matches: 1300, messages: 8800 },
    { day: 'Thu', swipes: 55000, matches: 1600, messages: 10200 },
    { day: 'Fri', swipes: 62000, matches: 1800, messages: 12500 },
    { day: 'Sat', swipes: 78000, matches: 2200, messages: 15800 },
    { day: 'Sun', swipes: 71000, matches: 2000, messages: 14200 }
  ];

  const revenue = [
    { month: 'Jan', revenue: 65000, subscriptions: 2800 },
    { month: 'Feb', revenue: 72000, subscriptions: 3100 },
    { month: 'Mar', revenue: 78000, subscriptions: 3400 },
    { month: 'Apr', revenue: 82000, subscriptions: 3600 },
    { month: 'May', revenue: 89000, subscriptions: 3900 },
    { month: 'Jun', revenue: 95000, subscriptions: 4200 }
  ];

  const demographics = [
    { age: '18-24', male: 2500, female: 2800 },
    { age: '25-34', male: 4200, female: 4800 },
    { age: '35-44', male: 2800, female: 2400 },
    { age: '45-54', male: 1200, female: 1000 },
    { age: '55+', male: 600, female: 500 }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex gap-4">
          <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
          <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">25,800</p>
          <p className="text-sm text-green-600 mt-1">+14.3% growth</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Daily Active Users</h3>
          <p className="text-2xl font-bold text-pink-600 mt-2">8,421</p>
          <p className="text-sm text-green-600 mt-1">32.6% DAU/MAU</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg. Session Time</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">18.5 min</p>
          <p className="text-sm text-green-600 mt-1">+2.3 min vs last week</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">22.4%</p>
          <p className="text-sm text-green-600 mt-1">+1.8% vs last month</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#ec4899" fill="#fce7f3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Engagement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="matches" fill="#ec4899" name="Matches" />
              <Bar dataKey="messages" fill="#8b5cf6" name="Messages (100s)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Demographics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demographics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="age" type="category" />
              <Tooltip />
              <Bar dataKey="male" fill="#3b82f6" name="Male" />
              <Bar dataKey="female" fill="#ec4899" name="Female" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-pink-600">4.8</p>
            <p className="text-sm text-gray-500 mt-1">App Store Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">67%</p>
            <p className="text-sm text-gray-500 mt-1">7-Day Retention</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">2.3</p>
            <p className="text-sm text-gray-500 mt-1">Messages per Match</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">18.5%</p>
            <p className="text-sm text-gray-500 mt-1">Match Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
