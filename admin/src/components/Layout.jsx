import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/profiles', label: 'Profiles', icon: '💑' },
  { path: '/matches', label: 'Matches', icon: '💘' },
  { path: '/messages', label: 'Messages', icon: '💬' },
  { path: '/subscriptions', label: 'Subscriptions', icon: '💳' },
  { path: '/moderation', label: 'Moderation', icon: '🛡️' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' }
];

function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-pink-400">Dating Platform</h1>
          <p className="text-sm text-gray-400 mt-1">Admin Dashboard</p>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="text-xs text-gray-500">
            <p>Dating Platform v1.0</p>
            <p>White-Label Ready</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
