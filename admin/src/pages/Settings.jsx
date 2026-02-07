import React, { useState } from 'react';

function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Platform Settings</h1>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General Settings' },
              { id: 'branding', label: 'Branding & Theme' },
              { id: 'matching', label: 'Matching Algorithm' },
              { id: 'subscriptions', label: 'Subscription Plans' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'security', label: 'Security' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'compliance', label: 'Compliance' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
                    defaultValue="Dating Platform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
                    defaultValue="support@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Age</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
                    defaultValue="18"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" defaultChecked />
                  <label className="ml-2 text-sm text-gray-700">Enable new user registrations</label>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" defaultChecked />
                  <label className="ml-2 text-sm text-gray-700">Require email verification</label>
                </div>

                <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-lg">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Branding & Theme</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" defaultValue="#ec4899" className="h-10 w-20" />
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
                      defaultValue="#ec4899"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500">Drag and drop or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500">Drag and drop or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">ICO, PNG 32x32</p>
                  </div>
                </div>

                <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-lg">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'matching' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Matching Algorithm Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Radius (default, km)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
                    defaultValue="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age Range Buffer</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
                    defaultValue="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Swipe Limit (Free Users)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500"
                    defaultValue="100"
                  />
                </div>

                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" defaultChecked />
                  <label className="ml-2 text-sm text-gray-700">Enable AI-powered matching</label>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" defaultChecked />
                  <label className="ml-2 text-sm text-gray-700">Boost new users in search results</label>
                </div>

                <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-lg">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Photo Verification</h3>
                    <p className="text-sm text-gray-500">Require selfie verification for profiles</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">AI Content Moderation</h3>
                    <p className="text-sm text-gray-500">Automatically scan photos and messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-lg">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Compliance Settings</h2>

              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">MCC 7273 Compliance</h3>
                  <p className="text-sm text-blue-700 mt-1">Dating and Escort Services merchant category compliance enabled</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Age Verification</h3>
                    <p className="text-sm text-gray-500">Require ID verification for all users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">GDPR Compliance</h3>
                    <p className="text-sm text-gray-500">Enable GDPR data export and deletion requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Data Retention Policy</h3>
                    <p className="text-sm text-gray-500">Auto-delete inactive accounts after 2 years</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-lg">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'subscriptions' || activeTab === 'notifications' || activeTab === 'integrations') && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h2>
              <p className="text-gray-500">Configure {activeTab} settings for your platform.</p>
              <button className="mt-6 bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-lg">
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
