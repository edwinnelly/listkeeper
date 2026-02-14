'use client';

import React, { useState } from 'react';
import {
  FileText,
  Users,
  CreditCard,
  Globe,
  ChevronRight,
  Plus,
  BarChart3,
  Building2,
  MapPin,
  Phone,
  Calendar,
  Image as ImageIcon,
  BookmarkCheck,
  DollarSign,
  Receipt,
  UserCheck,
  PieChart,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import Business from '../business/businessbtn';

/* ---------------- Types ---------------- */
interface User {
  id: number;
  name: string;
  creator: 'Host' | 'Manager' | 'Staff';
  active_business_key: string;
  business_key: string;
}

interface DashboardProps {
  logo: string;
  business_name: string;
  about_business: string;
  address?: string;
  phone?: string;
  subscription_type?: string;
  created_at?: string;
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired";
  user?: User;
  
}


interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  description?: string;
}

interface MetricData {
  label: string;
  value: string;
  change?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  data: MetricData[];
  color: 'blue' | 'emerald' | 'violet' | 'amber';
}

/* ---------------- Dashboard ---------------- */

const Dashboard: React.FC<DashboardProps> = ({
  logo,
  business_name,
  about_business,
  created_at,
  subscription_type,
  address = "123 Business Ave, City, State",
  phone = "+1 (555) 123-4567",
  // established_date = "Est. 2020",
  subscriptionStatus = "active",
  user,
}) => {
  const [imageError, setImageError] = useState(false);
 

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory Overview
              </h1>
            </div>
            <p className="text-gray-600 text-sm ml-5">
              Monitor your business performance and inventory health
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow-md">
              <Plus size={18} className="mr-2" />
              Add Widget
            </button>
            <button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-sm hover:shadow-md">
              <FileText size={18} className="mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Business Info */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Logo and Info */}
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-2 shadow-sm">
                      {!imageError ? (
                        <img
                          src={`http://localhost:8000/storage/${logo}`}
                          alt={`${business_name} Logo`}
                          className="w-full h-full rounded-xl object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center">
                          <Building2 size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {business_name}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          Active
                        </span>
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                          {subscription_type}
                        </span>
                      </div>
                    </div>
                    <Business />
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <InfoItem
                      icon={<MapPin size={16} />}
                      label="Address"
                      value={address}
                    />
                    <InfoItem
                      icon={<Phone size={16} />}
                      label="Contact"
                      value={phone}
                    />
                  </div>

                  {/* Inventory Summary */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">
                          Inventory Summary
                        </p>
                        <div className="flex items-center gap-6">
                          <SummaryItem
                            value="2,847"
                            label="Total Items"
                            color="text-gray-900"
                          />
                          <Divider />
                          <SummaryItem
                            value="156"
                            label="Low Stock"
                            color="text-amber-600"
                          />
                          <SummaryItem
                            value="24"
                            label="Out of Stock"
                            color="text-red-600"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Established</p>
                        <p className="text-sm font-medium text-gray-900">
                          {created_at}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-sm">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Add Product",
                  "View Reports",
                  "Manage Orders",
                  "Supplier List",
                ].map((text, i) => (
                  <button
                    key={i}
                    className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm font-medium"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Inventory Value"
            value="$245,231"
            icon={<DollarSign size={20} />}
          />
          <StatCard
            title="Active Products"
            value="2,847"
            icon={<Package size={20} />}
          />
          <StatCard
            title="Pending Orders"
            value="156"
            icon={<ShoppingCart size={20} />}
          />
          <StatCard
            title="Stockout Items"
            value="24"
            icon={<AlertTriangle size={20} />}
          />
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricCard
            icon={<TrendingUp size={20} />}
            title="Sales Performance"
            color="blue"
            data={[
              { label: "Total Revenue", value: "$45,231", change: "+12.4%" },
              { label: "Units Sold", value: "2,847", change: "+8.2%" },
              { label: "Avg. Order Value", value: "$156", change: "+3.1%" },
            ]}
          />
          <MetricCard
            icon={<Package size={20} />}
            title="Inventory Health"
            color="emerald"
            data={[
              { label: "Stock Turnover", value: "4.2x", change: "+0.3x" },
              { label: "Sell-through Rate", value: "68%", change: "+5%" },
              { label: "Stockout Rate", value: "2.4%", change: "-0.8%" },
            ]}
          />
          <MetricCard
            icon={<Users size={20} />}
            title="Supplier Metrics"
            color="violet"
            data={[
              { label: "Active Suppliers", value: "42", change: "+2" },
              { label: "Avg. Lead Time", value: "5.2 days", change: "-0.5" },
              { label: "On-time Delivery", value: "94%", change: "+2%" },
            ]}
          />
        </div>
      </main>
    </div>
  );
};

/* ---------------- Helper Components ---------------- */

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const Divider = () => <div className="h-8 w-px bg-gray-200" />;

const SummaryItem = ({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) => (
  <div className="text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

/* ---------------- Stat Card ---------------- */

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2.5 rounded-xl bg-blue-50 text-gray-600 border border-blue-100">{icon}</div>
    </div>
    <div className="mb-2">
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-700 font-medium text-sm">{title}</p>
    </div>
    {description && <p className="text-gray-500 text-xs">{description}</p>}
  </div>
);

/* ---------------- Metric Card ---------------- */

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, data, color }) => {
  const colorClasses = {
    blue: 'border-blue-200',
    emerald: 'border-emerald-200',
    violet: 'border-violet-200',
    amber: 'border-amber-200',
  }[color];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className={`p-2.5 rounded-xl border ${colorClasses}`}>{icon}</div>
      </div>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{item.value}</span>
              {item.change && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    item.change.startsWith('+')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {item.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="mt-6 w-full py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 border border-gray-200 transition-all duration-200 flex items-center justify-center text-sm">
        View Details
        <ChevronRight size={14} className="ml-1" />
      </button>
    </div>
  );
};

export default Dashboard;
