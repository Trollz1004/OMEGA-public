import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../services/api';

function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample users data
  const sampleUsers = [
    { id: 1, email: 'user1@example.com', name: 'Sarah Johnson', status: 'active', verified: true, subscription: 'premium', createdAt: '2024-01-15' },
    { id: 2, email: 'user2@example.com', name: 'Michael Chen', status: 'active', verified: true, subscription: 'basic', createdAt: '2024-01-14' },
    { id: 3, email: 'user3@example.com', name: 'Emily Davis', status: 'pending', verified: false, subscription: 'none', createdAt: '2024-01-13' },
    { id: 4, email: 'user4@example.com', name: 'James Wilson', status: 'suspended', verified: true, subscription: 'premium', createdAt: '2024-01-12' },
    { id: 5, email: 'user5@example.com', name: 'Lisa Anderson', status: 'active', verified: true, subscription: 'vip', createdAt: '2024-01-11' }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`;
  };

  const getSubscriptionBadge = (sub) => {
    const styles = {
      vip: 'bg-purple-100 text-purple-800',
      premium: 'bg-pink-100 text-pink-800',
      basic: 'bg-blue-100 text-blue-800',
      none: 'bg-gray-100 text-gray-800'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[sub] || styles.none}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">
          Export Users
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription</label>
            <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500">
              <option value="all">All Plans</option>
              <option value="vip">VIP</option>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
              <option value="none">Free</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sampleUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(user.status)}>{user.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getSubscriptionBadge(user.subscription)}>{user.subscription}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-yellow-600">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-pink-600 hover:text-pink-900 mr-3">View</button>
                  <button className="text-gray-600 hover:text-gray-900 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Suspend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
            <span className="font-medium">15,234</span> users
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 border rounded text-sm bg-pink-600 text-white">1</button>
            <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Users;
