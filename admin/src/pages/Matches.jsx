import React from 'react';

function Matches() {
  const matches = [
    { id: 1, user1: 'Sarah J.', user2: 'Michael C.', matchDate: '2024-01-15', status: 'active', messagesExchanged: 47 },
    { id: 2, user1: 'Emily D.', user2: 'James W.', matchDate: '2024-01-14', status: 'active', messagesExchanged: 23 },
    { id: 3, user1: 'Lisa A.', user2: 'David K.', matchDate: '2024-01-13', status: 'expired', messagesExchanged: 5 },
    { id: 4, user1: 'Anna M.', user2: 'Robert B.', matchDate: '2024-01-12', status: 'active', messagesExchanged: 112 },
    { id: 5, user1: 'Jessica T.', user2: 'William R.', matchDate: '2024-01-11', status: 'unmatched', messagesExchanged: 8 }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      unmatched: 'bg-red-100 text-red-800'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Match Management</h1>
        <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">
          Export Match Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Matches</h3>
          <p className="text-2xl font-bold text-pink-600 mt-2">42,891</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Matches</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">28,412</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Today's Matches</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">234</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Match Rate</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">18.5%</p>
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{match.id.toString().padStart(6, '0')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">{match.user1}</span>
                    <span className="mx-2 text-pink-500">&#10084;</span>
                    <span className="text-sm text-gray-900">{match.user2}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {match.matchDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(match.status)}>{match.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {match.messagesExchanged}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-pink-600 hover:text-pink-900 mr-3">View</button>
                  <button className="text-gray-600 hover:text-gray-900">Messages</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Matches;
