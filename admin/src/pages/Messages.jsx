import React from 'react';

function Messages() {
  const conversations = [
    { id: 1, participants: ['Sarah J.', 'Michael C.'], lastMessage: 'Looking forward to meeting you!', timestamp: '2 min ago', messageCount: 47, flagged: false },
    { id: 2, participants: ['Emily D.', 'James W.'], lastMessage: 'That sounds great!', timestamp: '15 min ago', messageCount: 23, flagged: false },
    { id: 3, participants: ['Lisa A.', 'David K.'], lastMessage: '[Flagged Content]', timestamp: '1 hour ago', messageCount: 12, flagged: true },
    { id: 4, participants: ['Anna M.', 'Robert B.'], lastMessage: 'See you at 7pm!', timestamp: '2 hours ago', messageCount: 89, flagged: false },
    { id: 5, participants: ['Jessica T.', 'William R.'], lastMessage: 'Nice to meet you!', timestamp: '3 hours ago', messageCount: 8, flagged: false }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Message Center</h1>
        <div className="flex gap-4">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg">
            Flagged Messages (3)
          </button>
          <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">
            Export Logs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Messages</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">892,341</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Today's Messages</h3>
          <p className="text-2xl font-bold text-pink-600 mt-2">4,521</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Conversations</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">12,892</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Flagged Content</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">23</p>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conversations.map((conv) => (
              <tr key={conv.id} className={`hover:bg-gray-50 ${conv.flagged ? 'bg-red-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{conv.participants[0]}</span>
                    <span className="mx-2 text-gray-400">&amp;</span>
                    <span className="text-sm font-medium text-gray-900">{conv.participants[1]}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className={`text-sm ${conv.flagged ? 'text-red-600 font-medium' : 'text-gray-500'} truncate max-w-xs`}>
                    {conv.lastMessage}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {conv.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {conv.messageCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {conv.flagged ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Flagged
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Normal
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-pink-600 hover:text-pink-900 mr-3">View</button>
                  {conv.flagged && (
                    <button className="text-green-600 hover:text-green-900 mr-3">Approve</button>
                  )}
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Messages;
