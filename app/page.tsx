'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  ChevronRight,
  MoreVertical,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  Receipt,
  BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';

const DailyHighlights = () => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const todayData = {
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    revenue: {
      total: '₦845,000',
      growth: '+12.5%',
      isPositive: true,
      comparison: 'vs yesterday',
    },
    orders: {
      total: '47',
      growth: '+8.3%',
      isPositive: true,
      pending: 12,
    },
    customers: {
      total: '28',
      growth: '-2.4%',
      isPositive: false,
      new: 8,
    },
    inventory: {
      lowStock: 5,
      outOfStock: 2,
      total: '1,245',
    },
  };

  const metrics = [
    {
      label: 'Total Revenue',
      value: todayData.revenue.total,
      growth: todayData.revenue.growth,
      isPositive: todayData.revenue.isPositive,
      icon: DollarSign,
      color: 'green',
      detail: todayData.revenue.comparison,
    },
    {
      label: 'Orders',
      value: todayData.orders.total,
      growth: todayData.orders.growth,
      isPositive: todayData.orders.isPositive,
      icon: ShoppingCart,
      color: 'blue',
      detail: `${todayData.orders.pending} pending`,
    },
    {
      label: 'Customers',
      value: todayData.customers.total,
      growth: todayData.customers.growth,
      isPositive: todayData.customers.isPositive,
      icon: Users,
      color: 'purple',
      detail: `${todayData.customers.new} new`,
    },
    {
      label: 'Inventory Alerts',
      value: `${todayData.inventory.lowStock + todayData.inventory.outOfStock}`,
      growth: 'Needs attention',
      isPositive: false,
      icon: Package,
      color: 'amber',
      detail: `${todayData.inventory.lowStock} low, ${todayData.inventory.outOfStock} out`,
    },
  ];

  const recentActivities = [
    {
      icon: Receipt,
      title: 'New order #INV-2024-0892',
      description: '₦125,000 - Adeola Stores',
      time: '10 mins ago',
      color: 'blue',
    },
    {
      icon: AlertCircle,
      title: 'Low stock alert',
      description: 'Tomato Paste - Only 5 units left',
      time: '25 mins ago',
      color: 'amber',
    },
    {
      icon: BadgeCheck,
      title: 'Payment confirmed',
      description: '₦340,000 - Okafor Holdings',
      time: '1 hour ago',
      color: 'green',
    },
    {
      icon: Package,
      title: 'Stock received',
      description: '50 units of Rice (50kg) added',
      time: '3 hours ago',
      color: 'indigo',
    },
  ];

  const quickInsights = [
    {
      title: 'Top Selling Product',
      value: 'Indomie Noodles (40pk)',
      metric: '32 units sold',
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Peak Sales Hour',
      value: '2:00 PM - 4:00 PM',
      metric: '35% of daily sales',
      icon: Clock,
      color: 'blue',
    },
    {
      title: 'Revenue Target',
      value: '₦1,000,000',
      metric: '84.5% achieved',
      icon: Target,
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                    Daily Highlights
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {greeting}, here's your business summary
                </h1>
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                  <Calendar size={14} />
                  {todayData.date}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Yesterday
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                  Today
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-${metric.color}-50 border border-${metric.color}-100 flex items-center justify-center`}>
                  <metric.icon size={20} className={`text-${metric.color}-600`} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${metric.isPositive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                  }`}>
                  {metric.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {metric.growth}
                </div>
              </div>

              <p className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-gray-500 font-medium">
                {metric.label}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {metric.detail}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Quick Insights</h2>
                  <p className="text-sm text-gray-500">Key business metrics at a glance</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View all <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl bg-${insight.color}-50 border border-${insight.color}-100`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center`}>
                        <insight.icon size={16} className={`text-${insight.color}-600`} />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{insight.title}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{insight.value}</p>
                    <p className="text-xs text-gray-500">{insight.metric}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500">Latest transactions and updates</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View all <ChevronRight size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${activity.color}-50 border border-${activity.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <activity.icon size={18} className={`text-${activity.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Right 1/3 */}
          <div className="space-y-6">
            {/* Daily Goal Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Daily Goal</h3>
                <Target size={20} className="text-gray-400" />
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold mb-1">₦845,000</p>
                <p className="text-gray-400 text-sm">of ₦1,000,000 target</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-700 rounded-full mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: '84.5%' }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">84.5% achieved</span>
                <span className="text-blue-400 font-medium">₦155,000 to go</span>
              </div>
            </motion.div>

            {/* Inventory Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
            
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Inventory Alerts</h3>
                <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg">
                  {todayData.inventory.lowStock + todayData.inventory.outOfStock} alerts
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-red-700">Out of Stock</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">{todayData.inventory.outOfStock}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">Low Stock</span>
                  </div>
                  <span className="text-sm font-bold text-amber-700">{todayData.inventory.lowStock}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-green-700">In Stock</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">{todayData.inventory.total}</span>
                </div>
              </div>

              <Link
                href="/inventory"
                className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-4 py-2"
              >
                Manage Inventory <ChevronRight size={16} />
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'New Sales Order', icon: ShoppingCart },
                  { label: 'Add Stock', icon: Package },
                  { label: 'View Reports', icon: BarChart3 },
                ].map((action, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <action.icon size={16} className="text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyHighlights;