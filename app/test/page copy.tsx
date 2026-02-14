'use client';

import React from 'react';
import {
  Home,
  Users,
  Server,
  Settings,
  Bell,
  Search,
  ChevronRight,
  PieChart as PieIcon,
  BarChart as BarIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/**
 * Google Admin Dashboard - Single-file TSX React component
 * - Tailwind utility classes (assumes Tailwind is configured)
 * - Uses lucide-react for icons and recharts for charts
 * - Responsive layout with sidebar, header, stat cards, charts, user table
 *
 * Usage: place this file in a React/Next project and render <GoogleAdminDashboard />
 */

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend = 'up' }) => {
  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-300">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-slate-700/40">{icon}</div>
      </div>
      {change && (
        <div className="mt-3 text-sm flex items-center gap-2">
          <span className={`text-${trend === 'up' ? 'green' : 'red'}-600 font-medium`}>{change}</span>
          <span className="text-slate-400">vs last week</span>
        </div>
      )}
    </div>
  );
};

const usersData = [
  { name: 'Jan', users: 400 },
  { name: 'Feb', users: 420 },
  { name: 'Mar', users: 520 },
  { name: 'Apr', users: 610 },
  { name: 'May', users: 700 },
  { name: 'Jun', users: 850 },
  { name: 'Jul', users: 900 },
  { name: 'Aug', users: 820 },
  { name: 'Sep', users: 940 },
];

const trafficData = [
  { name: 'Web', value: 64 },
  { name: 'Mobile', value: 26 },
  { name: 'API', value: 10 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const recentUsers = [
  { id: 'u_001', name: 'Aisha Bello', email: 'aisha@example.com', role: 'Admin', status: 'Active' },
  { id: 'u_002', name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Suspended' },
  { id: 'u_003', name: 'Sade Okoye', email: 'sade@example.com', role: 'Manager', status: 'Active' },
  { id: 'u_004', name: 'Emeka N.', email: 'emeka@example.com', role: 'User', status: 'Pending' },
];

export default function GoogleAdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
            <div className="sticky top-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold">G</div>
                <div>
                  <p className="font-semibold">Google Admin</p>
                  <p className="text-xs text-slate-400">Super Admin</p>
                </div>
              </div>

              <nav className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700">
                <ul className="space-y-1">
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Home className="h-5 w-5" /> <span className="font-medium">Overview</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Users className="h-5 w-5" /> <span className="font-medium">Users</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Server className="h-5 w-5" /> <span className="font-medium">Devices</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <PieIcon className="h-5 w-5" /> <span className="font-medium">Reports</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Settings className="h-5 w-5" /> <span className="font-medium">Settings</span>
                  </li>
                </ul>
              </nav>

              <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-medium">Security</p>
                <p className="text-xs text-slate-500 mt-2">2FA enforced for 87% of accounts</p>
                <div className="mt-3 flex gap-2 items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-xs">All systems nominal</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main area */}
          <main className="col-span-12 lg:col-span-9 xl:col-span-10">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Admin Console</h1>
                <div className="hidden md:flex items-center gap-2 bg-white/80 dark:bg-slate-800/60 rounded-full px-3 py-1 border border-slate-100 dark:border-slate-700">
                  <Search className="h-4 w-4" />
                  <input className="bg-transparent outline-none text-sm" placeholder="Search users, devices, reports..." />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img src="https://i.pravatar.cc/40?img=5" alt="avatar" className="h-9 w-9 rounded-full" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">Edwin Eke</p>
                    <p className="text-xs text-slate-400">Super Admin</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="Active Users" value={12458} change="+6.2%" icon={<Users className="h-6 w-6" />} trend="up" />
              <StatCard title="Suspicious Logins" value={12} change="-9.1%" icon={<Server className="h-6 w-6" />} trend="down" />
              <StatCard title="Devices" value={4820} change="+2.3%" icon={<BarIcon className="h-6 w-6" />} trend="up" />
              <StatCard title="Storage Used" value="1.2 TB" change="+0.4%" icon={<PieIcon className="h-6 w-6" />} trend="up" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Users chart */}
              <div className="col-span-2 bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Users over time</h3>
                  <div className="text-sm text-slate-500">Last 9 months</div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usersData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={3} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Traffic pie */}
              <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Traffic sources</h3>
                  <div className="text-sm text-slate-500">Realtime</div>
                </div>
                <div style={{ height: 260 }} className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={trafficData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={35} label>
                        {trafficData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="col-span-2 bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent users</h3>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span>View all</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-sm">
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u) => (
                        <tr key={u.id} className="border-t border-slate-100 dark:border-slate-700">
                          <td className="py-3">{u.name}</td>
                          <td className="py-3 text-sm text-slate-500">{u.email}</td>
                          <td className="py-3 text-sm">{u.role}</td>
                          <td className="py-3 text-sm">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${
                                u.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : u.status === 'Suspended'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm">
                            <button className="text-sm text-blue-600 underline">Manage</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold mb-3">Security activity</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
                      <div>
                        <p className="font-medium">Failed login attempts</p>
                        <p className="text-xs text-slate-400">7 in the last hour</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-yellow-400 mt-2" />
                      <div>
                        <p className="font-medium">New device enrolled</p>
                        <p className="text-xs text-slate-400">2 devices in last 24h</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="font-medium">2FA enabled</p>
                        <p className="text-xs text-slate-400">87% adoption</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer small */}
            <div className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Google Admin — demo UI</div>
          </main>
        </div>
      </div>
    </div>
  );
}
