'use client';

import React, { useState } from 'react';
import {
  Home,
  Package as PackageIcon,
  Truck,
  Users,
  Database,
  Settings,
  Bell,
  Search,
  ChevronRight,
  PieChart as PieIcon,
  BarChart as BarIcon,
  MapPin,
  DollarSign,
  Layers,
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
 * Inventory Management — Business Dashboard (Single-file TSX)
 * - TailwindCSS styling (assumes Tailwind configured)
 * - lucide-react icons and recharts for charts
 * - Multi-branch (warehouse) view, sales trends, low-stock alerts
 *
 * Drop into a Next/React app and render <InventoryDashboard />
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
          <span className="text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
};

// --- Sample demo data (replace with API data later) ---
const salesData = [
  { name: 'Jan', sales: 12000 },
  { name: 'Feb', sales: 15000 },
  { name: 'Mar', sales: 17000 },
  { name: 'Apr', sales: 14000 },
  { name: 'May', sales: 22000 },
  { name: 'Jun', sales: 24000 },
  { name: 'Jul', sales: 26000 },
  { name: 'Aug', sales: 23000 },
  { name: 'Sep', sales: 28000 },
];

const categoryData = [
  { name: 'Electronics', value: 45 },
  { name: 'Apparel', value: 25 },
  { name: 'Home', value: 15 },
  { name: 'Beauty', value: 8 },
  { name: 'Other', value: 7 },
];

const warehouseData = [
  { name: 'Main Warehouse', stock: 12000 },
  { name: 'Lagos Branch', stock: 4200 },
  { name: 'Abuja Branch', stock: 3300 },
  { name: 'Kano Branch', stock: 2100 },
];

const COLORS = ['#4f46e5', '#06b6d4', '#34d399', '#f59e0b', '#ef4444'];

const lowStockProducts = [
  { sku: 'P-1001', name: 'Wireless Mouse', qty: 3, reorderLevel: 10, warehouse: 'Lagos Branch' },
  { sku: 'P-2004', name: 'USB-C Charger', qty: 5, reorderLevel: 20, warehouse: 'Main Warehouse' },
  { sku: 'P-3010', name: 'Denim Jacket - M', qty: 2, reorderLevel: 15, warehouse: 'Abuja Branch' },
  { sku: 'P-4040', name: 'Ceramic Mug', qty: 9, reorderLevel: 25, warehouse: 'Kano Branch' },
];

export default function InventoryDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All Branches');

  // Derived stats (demo calculations)
  const totalStockValue = '₦' + (warehouseData.reduce((s, w) => s + w.stock, 0) * 15).toLocaleString(); // assume avg unit price
  const lowStockCount = lowStockProducts.length;
  const monthlySales = '₦' + salesData[salesData.length - 1].sales.toLocaleString();
  const pendingOrders = 18;

  const warehouses = ['All Branches', ...warehouseData.map((w) => w.name)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
            <div className="sticky top-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-400 flex items-center justify-center text-white font-bold">Y</div>
                <div>
                  <p className="font-semibold">Yelocode Inventory</p>
                  <p className="text-xs text-slate-400">Inventory Manager</p>
                </div>
              </div>

              <nav className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700">
                <ul className="space-y-1">
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Home className="h-5 w-5" /> <span className="font-medium">Overview</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <PackageIcon className="h-5 w-5" /> <span className="font-medium">Products</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Users className="h-5 w-5" /> <span className="font-medium">Suppliers</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Truck className="h-5 w-5" /> <span className="font-medium">Purchase Orders</span>
                  </li>
                  <li className="px-2 py-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-700/40 flex items-center gap-3">
                    <Database className="h-5 w-5" /> <span className="font-medium">Warehouses</span>
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
                <p className="text-sm font-medium">Sync status</p>
                <p className="text-xs text-slate-500 mt-2">Last sync: 20 minutes ago</p>
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
                <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
                <div className="hidden md:flex items-center gap-2 bg-white/80 dark:bg-slate-800/60 rounded-full px-3 py-1 border border-slate-100 dark:border-slate-700">
                  <Search className="h-4 w-4" />
                  <input className="bg-transparent outline-none text-sm" placeholder="Search products, suppliers, SKUs..." />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="hidden sm:block bg-white/80 dark:bg-slate-800/60 rounded-full px-3 py-1 border border-slate-100 dark:border-slate-700 text-sm outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>

                <button className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img src="https://i.pravatar.cc/40?img=5" alt="avatar" className="h-9 w-9 rounded-full" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">Edwin Eke</p>
                    <p className="text-xs text-slate-400">Inventory Manager</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Stock Value" value={totalStockValue} change="+4.8%" icon={<DollarSign className="h-6 w-6" />} trend="up" />
              <StatCard title="Low Stock Items" value={lowStockCount} change="-12%" icon={<Layers className="h-6 w-6" />} trend="down" />
              <StatCard title="Monthly Sales" value={monthlySales} change="+8.1%" icon={<BarIcon className="h-6 w-6" />} trend="up" />
              <StatCard title="Pending Orders" value={pendingOrders} change="-3%" icon={<Truck className="h-6 w-6" />} trend="down" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales chart */}
              <div className="col-span-2 bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Sales trend</h3>
                  <div className="text-sm text-slate-500">Last 9 months</div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(val: number) => `₦${val.toLocaleString()}`} />
                      <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categories pie */}
              <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Top categories</h3>
                  <div className="text-sm text-slate-500">Share</div>
                </div>
                <div style={{ height: 260 }} className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40} label>
                        {categoryData.map((entry, index) => (
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

            {/* Table + Warehouse bar chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="col-span-2 bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Low stock items</h3>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span>View all</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-sm">
                        <th className="py-2 pr-4">SKU</th>
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Reorder Level</th>
                        <th className="py-2 pr-4">Warehouse</th>
                        <th className="py-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((p) => (
                        <tr key={p.sku} className="border-t border-slate-100 dark:border-slate-700">
                          <td className="py-3">{p.sku}</td>
                          <td className="py-3">{p.name}</td>
                          <td className="py-3 text-sm text-slate-500">{p.qty}</td>
                          <td className="py-3 text-sm">{p.reorderLevel}</td>
                          <td className="py-3 text-sm">{p.warehouse}</td>
                          <td className="py-3 text-sm">
                            <button className="text-sm text-blue-600 underline">Create PO</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold mb-3">Stock by warehouse</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={warehouseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="stock" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-sm text-slate-500">Tip: click a warehouse to filter (coming soon)</div>
              </div>
            </div>

            {/* Activity / Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="col-span-2 bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold mb-3">Recent activity</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
                      <div>
                        <p className="font-medium">Low stock alert: Wireless Mouse</p>
                        <p className="text-xs text-slate-400">3 left in Lagos Branch — suggested reorder: 50 units</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-yellow-400 mt-2" />
                      <div>
                        <p className="font-medium">Purchase order delayed</p>
                        <p className="text-xs text-slate-400">PO #4523 arriving 2 days late</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="font-medium">New stock received</p>
                        <p className="text-xs text-slate-400">150 units of USB-C Charger added to Main Warehouse</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold mb-3">Quick actions</h3>
                <div className="flex flex-col gap-3">
                  <button className="w-full text-left bg-indigo-600 text-white px-4 py-2 rounded">Create Purchase Order</button>
                  <button className="w-full text-left border border-slate-200 px-4 py-2 rounded">Add New Product</button>
                  <button className="w-full text-left border border-slate-200 px-4 py-2 rounded">Stock Adjustment</button>
                </div>
              </div>
            </div>

            {/* Footer small */}
            <div className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Yelocode — Inventory Dashboard (demo)</div>
          </main>
        </div>
      </div>
    </div>
  );
}
