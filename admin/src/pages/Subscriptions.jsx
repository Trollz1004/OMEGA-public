import React from 'react';

function Subscriptions() {
  const subscriptions = [
    { id: 1, user: 'Sarah J.', plan: 'VIP', amount: 49.99, startDate: '2024-01-01', nextBilling: '2024-02-01', status: 'active' },
    { id: 2, user: 'Michael C.', plan: 'Premium', amount: 29.99, startDate: '2024-01-05', nextBilling: '2024-02-05', status: 'active' },
    { id: 3, user: 'Emily D.', plan: 'Basic', amount: 9.99, startDate: '2024-01-10', nextBilling: '2024-02-10', status: 'active' },
    { id: 4, user: 'James W.', plan: 'Premium', amount: 29.99, startDate: '2023-12-15', nextBilling: '2024-01-15', status: 'past_due' },
    { id: 5, user: 'Lisa A.', plan: 'VIP', amount: 49.99, startDate: '2023-11-20', nextBilling: '-', status: 'cancelled' }
  ];

  const plans = [
    { name: 'Basic', price: 9.99, features: ['Unlimited swipes', 'See who likes you', '5 Super Likes/day'], subscribers: 4521 },
    { name: 'Premium', price: 29.99, features: ['All Basic features', 'Unlimited Super Likes', 'Priority matching', 'Read receipts'], subscribers: 3892 },
    { name: 'VIP', price: 49.99, features: ['All Premium features', 'Profile boost weekly', 'Incognito mode', 'Advanced filters', 'Priority support'], subscribers: 1234 }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">
          Revenue Report
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">$85,250</p>
          <p className="text-sm text-green-600 mt-1">+12.5% vs last month</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">9,647</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg. Revenue/User</h3>
          <p className="text-2xl font-bold text-pink-600 mt-2">$24.82</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Churn Rate</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">3.2%</p>
        </div>
      </div>

      {/* Subscription Plans */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div key={plan.name} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-pink-600">${plan.price}<span className="text-sm text-gray-500">/mo</span></p>
              </div>
              <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {plan.subscribers.toLocaleString()} subscribers
              </span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg">
              Edit Plan
            </button>
          </div>
        ))}
      </div>

      {/* Recent Subscriptions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Subscriptions</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Billing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sub.user}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sub.plan}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${sub.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sub.startDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sub.nextBilling}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(sub.status)}>{sub.status.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-pink-600 hover:text-pink-900 mr-3">View</button>
                  <button className="text-gray-600 hover:text-gray-900">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Subscriptions;
