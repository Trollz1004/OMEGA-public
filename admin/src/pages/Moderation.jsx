import React, { useState } from 'react';

function Moderation() {
  const [activeTab, setActiveTab] = useState('photos');

  const photoReports = [
    { id: 1, user: 'User #4521', type: 'Profile Photo', reason: 'Inappropriate content', reportedBy: 'AI System', date: '2024-01-15', priority: 'high' },
    { id: 2, user: 'User #3892', type: 'Gallery Photo', reason: 'Potential fake', reportedBy: 'User report', date: '2024-01-15', priority: 'medium' },
    { id: 3, user: 'User #2341', type: 'Profile Photo', reason: 'Violence', reportedBy: 'AI System', date: '2024-01-14', priority: 'high' },
    { id: 4, user: 'User #8923', type: 'Gallery Photo', reason: 'Copyright', reportedBy: 'User report', date: '2024-01-14', priority: 'low' }
  ];

  const messageReports = [
    { id: 1, from: 'User #4521', to: 'User #3892', reason: 'Harassment', date: '2024-01-15', priority: 'high' },
    { id: 2, from: 'User #1234', to: 'User #5678', reason: 'Spam', date: '2024-01-15', priority: 'medium' },
    { id: 3, from: 'User #9012', to: 'User #3456', reason: 'Solicitation', date: '2024-01-14', priority: 'high' }
  ];

  const profileReports = [
    { id: 1, user: 'User #4521', reason: 'Fake profile', reportedBy: 'Multiple users', date: '2024-01-15', priority: 'high' },
    { id: 2, user: 'User #7890', reason: 'Underage suspicion', reportedBy: 'User report', date: '2024-01-15', priority: 'critical' },
    { id: 3, user: 'User #2345', reason: 'Impersonation', reportedBy: 'User report', date: '2024-01-14', priority: 'medium' }
  ];

  const getPriorityBadge = (priority) => {
    const styles = {
      critical: 'bg-purple-100 text-purple-800',
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <div className="flex gap-4">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg">
            Moderation Settings
          </button>
          <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">47</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Critical Issues</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">3</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Resolved Today</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">28</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg. Resolution Time</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">2.4h</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['photos', 'messages', 'profiles'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-pink-500 text-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab === 'photos' ? photoReports.length : tab === 'messages' ? messageReports.length : profileReports.length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Photo Reports */}
        {activeTab === 'photos' && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {photoReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reportedBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getPriorityBadge(report.priority)}>{report.priority}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-pink-600 hover:text-pink-900 mr-2">View</button>
                    <button className="text-green-600 hover:text-green-900 mr-2">Approve</button>
                    <button className="text-red-600 hover:text-red-900">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Message Reports */}
        {activeTab === 'messages' && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messageReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.from}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.to}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getPriorityBadge(report.priority)}>{report.priority}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-pink-600 hover:text-pink-900 mr-2">View</button>
                    <button className="text-green-600 hover:text-green-900 mr-2">Dismiss</button>
                    <button className="text-red-600 hover:text-red-900">Ban User</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Profile Reports */}
        {activeTab === 'profiles' && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profileReports.map((report) => (
                <tr key={report.id} className={`hover:bg-gray-50 ${report.priority === 'critical' ? 'bg-purple-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reportedBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getPriorityBadge(report.priority)}>{report.priority}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-pink-600 hover:text-pink-900 mr-2">Review</button>
                    <button className="text-green-600 hover:text-green-900 mr-2">Clear</button>
                    <button className="text-red-600 hover:text-red-900">Suspend</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Moderation;
