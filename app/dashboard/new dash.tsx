'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { withAuth } from '@/hoc/withAuth';
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/axios";
import NewAccount from '../component/newAccount';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Store,
  LayoutDashboard,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Coins,
  Receipt,
  Plus,
  ChevronRight,
  LineChart,
  CircleCheck,
  MapPin,
  Phone,
  Building2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Users,
  BarChart3,
  PieChart,
  Activity,
  MoreHorizontal,
  Calendar,
  Filter,
  Download,
  Bell,
  Search,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Location {
  id: number;
  location_key: string;
  location_name: string;
  address: string;
  phone?: string | null;
}

interface Business {
  id: number;
  business_key: string;
  business_name: string;
  subscription_type: string;
  about_business: string | null;
  address?: string | null;
  logo?: string | null;
  phone?: string | null;
  created_at?: string | null;
}

interface User {
  id: number;
  name: string;
  creator: 'Host' | 'Manager' | 'Staff';
  active_business_key: string;
  active_location_key?: string;
  business_key: string;
  businesses_one?: Business[];
  about_business: string;
}

// ─── White Theme Colors ───────────────────────────────────────────────────────

const COLORS = {
  bg: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    card: 'bg-white',
    hover: 'hover:bg-gray-50',
  },
  border: {
    default: 'border-gray-200',
    subtle: 'border-gray-100',
  },
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
  },
  gradient: {
    blue: 'from-blue-50 to-blue-100',
    purple: 'from-purple-50 to-pink-100',
    green: 'from-emerald-50 to-teal-100',
    orange: 'from-orange-50 to-amber-100',
    gray: 'from-gray-50 to-gray-100',
  }
};

// ─── ANIMATIONS ───────────────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-6 space-y-6">
    <div className="bg-gray-200 rounded-3xl h-32 animate-pulse" />
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-2xl h-36 animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <div className="bg-gray-200 rounded-2xl h-80 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-gray-200 rounded-2xl h-[32rem] animate-pulse" />
    </div>
  </div>
);

// ─── Loading Screen ───────────────────────────────────────────────────────────

const ModernLoadingScreen: React.FC = () => {
  const [loadingStep, setLoadingStep] = useState(0);
  const steps = [
    { icon: Sparkles, text: 'Initializing workspace...' },
    { icon: BarChart3, text: 'Loading analytics...' },
    { icon: Users, text: 'Syncing data...' },
    { icon: Zap, text: 'Almost ready...' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-6 relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-24 h-24 mx-auto mb-8"
        >
          <div className="absolute inset-0 rounded-3xl bg-gray-900 shadow-2xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 rounded-3xl border-2 border-dashed border-gray-300/50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <LayoutDashboard className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={loadingStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-3">
              {React.createElement(steps[loadingStep].icon, { 
                className: "h-5 w-5 text-gray-600" 
              })}
              <h2 className="text-xl font-bold text-gray-900">
                {steps[loadingStep].text}
              </h2>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 space-y-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto">
            <motion.div
              animate={{ width: ['0%', '100%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="h-full bg-gray-900 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Error State ──────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md mx-auto px-6"
    >
      <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-200">
        <Store className="h-10 w-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
      <p className="text-sm text-gray-600 mb-8">
        We encountered an issue loading your dashboard. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Retry
      </button>
    </motion.div>
  </div>
);

// ─── Quick Stats Cards ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  gradient: string;
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, trend, icon: Icon, gradient, index }) => (
  <motion.div
    variants={fadeInUp}
    initial="initial"
    animate="animate"
    transition={{ delay: index * 0.1 }}
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center border border-gray-200">
        <Icon className="h-6 w-6 text-gray-900" />
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
        trend === 'up' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {change}
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </motion.div>
);

const stats = [
  {
    label: 'Total Revenue',
    value: '₦2.4M',
    change: '+12.5%',
    trend: 'up' as const,
    icon: Coins,
    gradient: COLORS.gradient.blue,
  },
  {
    label: 'Paid Invoices',
    value: '38',
    change: '+24%',
    trend: 'up' as const,
    icon: Receipt,
    gradient: COLORS.gradient.green,
  },
  {
    label: 'Outstanding',
    value: '₦580K',
    change: '-3.2%',
    trend: 'down' as const,
    icon: Clock,
    gradient: COLORS.gradient.orange,
  },
  {
    label: 'Net Profit',
    value: '₦1.1M',
    change: '+8.3%',
    trend: 'up' as const,
    icon: TrendingUp,
    gradient: COLORS.gradient.purple,
  },
];

// ─── Revenue Chart ────────────────────────────────────────────────────────────

const RevenueChart: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = [280, 350, 420, 380, 540, 480, 620, 580, 700, 650, 750, 800];
  const expensesData = [180, 220, 260, 240, 280, 250, 300, 280, 320, 300, 340, 360];
  
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-gray-900 font-semibold">Revenue Overview</h3>
          <p className="text-sm text-gray-500 mt-1">Monthly revenue vs expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-900">
            Monthly
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Weekly
          </button>
          <button className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
            <Download className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="h-64 flex items-end gap-2">
        {revenueData.map((revenue, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full space-y-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(revenue / 800) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="w-full bg-gray-900 rounded-t-lg relative group cursor-pointer"
                style={{ minHeight: `${(revenue / 800) * 200}px` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ₦{revenue}K
                </div>
              </motion.div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(expensesData[i] / 800) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1 + 0.2 }}
                className="w-full bg-gray-300 rounded-t-lg"
                style={{ minHeight: `${(expensesData[i] / 800) * 200}px` }}
              />
            </div>
            <span className="text-xs text-gray-500 mt-2">{months[i]}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-900" />
          <span className="text-xs text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span className="text-xs text-gray-600">Expenses</span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Location Cards Grid ──────────────────────────────────────────────────────

interface LocationCardProps {
  location: Location;
  isActive: boolean;
  isSwitching: boolean;
  onSwitch: (key: string) => void;
  index: number;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, isActive, isSwitching, onSwitch, index }) => (
  <motion.button
    variants={fadeInUp}
    initial="initial"
    animate="animate"
    transition={{ delay: index * 0.05 }}
    onClick={() => !isActive && onSwitch(location.location_key)}
    disabled={isSwitching}
    className={`w-full text-left rounded-2xl p-5 transition-all duration-200 group relative overflow-hidden border ${
      isActive
        ? 'bg-gray-900 border-gray-800 shadow-md'
        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
    } ${isSwitching ? 'opacity-50 pointer-events-none' : ''}`}
  >
    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isActive ? 'bg-white/20' : 'bg-gray-100'
        }`}>
          <MapPin className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-900'}`} />
        </div>
        
        {isActive ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" /> Active
          </span>
        ) : (
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
        )}
      </div>
      
      <h4 className={`font-semibold mb-2 ${isActive ? 'text-white' : 'text-gray-900'}`}>{location.location_name}</h4>
      
      <div className="space-y-2">
        <p className={`text-xs flex items-start gap-1.5 ${isActive ? 'text-white/60' : 'text-gray-500'}`}>
          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          {location.address}
        </p>
        {location.phone && (
          <p className={`text-xs flex items-center gap-1.5 ${isActive ? 'text-white/60' : 'text-gray-500'}`}>
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            {location.phone}
          </p>
        )}
      </div>
      
      <div className={`mt-4 pt-4 border-t flex items-center justify-between text-xs ${
        isActive ? 'border-white/10 text-white/60' : 'border-gray-100 text-gray-500'
      }`}>
        <span>12 transactions</span>
        <span className={isActive ? 'text-white' : 'text-gray-900 font-medium'}>₦45K</span>
      </div>
    </div>
  </motion.button>
);

// ─── Activity Feed ────────────────────────────────────────────────────────────

const ActivityFeed: React.FC = () => {
  const activities = [
    { icon: ArrowDownLeft, title: 'Payment received', description: 'Bolaji Stores paid invoice #1042', time: '2 min ago', amount: '+₦240K' },
    { icon: ArrowUpRight, title: 'Expense recorded', description: 'Office supplies purchase', time: '1 hour ago', amount: '-₦18.5K' },
    { icon: Clock, title: 'Invoice due soon', description: 'Okafor Holdings - 3 days left', time: '3 hours ago', amount: '₦175K' },
    { icon: Users, title: 'New customer', description: 'Nnamdi & Co added to database', time: '5 hours ago', amount: '' },
    { icon: Receipt, title: 'Invoice generated', description: 'Invoice #1044 created', time: 'Yesterday', amount: '₦390K' },
  ];

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-gray-900 font-semibold">Recent Activity</h3>
          <p className="text-xs text-gray-500 mt-1">Latest transactions and updates</p>
        </div>
        <button className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
          View all
        </button>
      </div>

      <div className="space-y-1">
        {activities.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <activity.icon className="h-5 w-5 text-gray-700" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 font-medium">{activity.title}</p>
              <p className="text-xs text-gray-500 truncate">{activity.description}</p>
            </div>
            
            <div className="text-right flex-shrink-0">
              {activity.amount && (
                <p className="text-sm font-semibold text-gray-900">{activity.amount}</p>
              )}
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Quick Actions Panel ──────────────────────────────────────────────────────

const QuickActionsPanel: React.FC = () => {
  const actions = [
    { icon: Plus, label: 'New Invoice', description: 'Create and send', gradient: COLORS.gradient.blue },
    { icon: Receipt, label: 'Record Expense', description: 'Log payment', gradient: COLORS.gradient.green },
    { icon: BarChart3, label: 'Generate Report', description: 'P&L analysis', gradient: COLORS.gradient.purple },
    { icon: Users, label: 'Add Customer', description: 'New client', gradient: COLORS.gradient.orange },
  ];

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
    >
      <h3 className="text-gray-900 font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${action.gradient} hover:shadow-md transition-all group border border-gray-200`}
          >
            <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center mb-3 border border-gray-200">
              <action.icon className="h-5 w-5 text-gray-900" />
            </div>
            <p className="text-sm text-gray-900 font-medium text-left">{action.label}</p>
            <p className="text-xs text-gray-600 text-left mt-1">{action.description}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Business Info Card ───────────────────────────────────────────────────────

const BusinessInfoCard: React.FC<{ business: Business; createdAt: string; locationCount: number }> = ({ business, createdAt, locationCount }) => (
  <motion.div
    variants={fadeInUp}
    initial="initial"
    animate="animate"
    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
  >
    <div className="relative">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
            {business.logo ? (
              <img
                src={`http://localhost:8000/storage/${business.logo}`}
                alt={business.business_name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span className="text-gray-900 font-bold text-2xl">
                {business.business_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{business.business_name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="capitalize">{business.subscription_type}</span> Plan
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
          Active
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Calendar className="h-3.5 w-3.5" />
            Member since
          </div>
          <p className="text-gray-900 text-sm font-medium">{createdAt}</p>
        </div>
        
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Building2 className="h-3.5 w-3.5" />
            Locations
          </div>
          <p className="text-gray-900 text-sm font-medium">{locationCount} active</p>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Activity className="h-3.5 w-3.5" />
            Status
          </div>
          <p className="text-gray-900 text-sm font-medium">Operational</p>
        </div>
      </div>

      {(business.address || business.phone) && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
          {business.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {business.address}
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              {business.phone}
            </div>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

// ─── Dashboard Content ────────────────────────────────────────────────────────

const DashboardContent: React.FC<{
  user: User;
  business: Business;
  createdAt: string;
  locations: Location[];
  locationsLoading: boolean;
  activeLocationKey: string | undefined;
  isSwitching: boolean;
  onSwitchLocation: (key: string) => void;
}> = ({
  user,
  business,
  createdAt,
  locations,
  locationsLoading,
  activeLocationKey,
  isSwitching,
  onSwitchLocation,
}) => (
  <motion.div
    variants={stagger}
    initial="initial"
    animate="animate"
    className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50"
  >
    {/* Business Info Card */}
    <BusinessInfoCard
      business={business}
      createdAt={createdAt}
      locationCount={locations.length}
    />

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} index={i} />
      ))}
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Locations & Chart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Locations Section - MOVED BEFORE Revenue Chart */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900 font-semibold">Locations</h3>
              <p className="text-xs text-gray-500 mt-1">Manage your business locations</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus className="h-4 w-4" />
              Add Location
            </button>
          </div>

          {locationsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
              ))}
            </div>
          ) : locations.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-300">
              <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No locations added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {locations.map((loc, i) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  isActive={loc.location_key === activeLocationKey}
                  isSwitching={isSwitching}
                  onSwitch={onSwitchLocation}
                  index={i}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Revenue Chart - MOVED AFTER Locations */}
        <RevenueChart />
      </div>

      {/* Right Column - Activity & Quick Actions */}
      <div className="space-y-6">
        <ActivityFeed />
        <QuickActionsPanel />
      </div>
    </div>
  </motion.div>
);

// ─── Page Component ───────────────────────────────────────────────────────────

function DashboardPage({ user, loading }: { user: User | null; loading: boolean }): React.ReactElement {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activeLocationKey, setActiveLocationKey] = useState<string | undefined>(
    user?.active_location_key
  );

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowSkeleton(true), 2000);
      return () => clearTimeout(timer);
    }
    setShowSkeleton(false);
  }, [loading]);

  useEffect(() => {
    if (user?.active_location_key) {
      setActiveLocationKey(user.active_location_key);
    }
  }, [user?.active_location_key]);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await apiGet('/locations');
      const locArr =
        res?.data?.data?.locations ??
        res?.data?.data ??
        res?.data?.locations ??
        res?.data?.location ??
        [];
      setLocations(Array.isArray(locArr) ? locArr : []);
    } catch {
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      fetchLocations();
    }
  }, [loading, user, fetchLocations]);

  const handleSwitchLocation = async (locationKey: string) => {
    const previous = activeLocationKey;
    setActiveLocationKey(locationKey);
    setIsSwitching(true);
    try {
      await apiGet('/locations', { location_key: locationKey });
    } catch (err) {
      console.error('Failed to switch location:', err);
      setActiveLocationKey(previous);
    } finally {
      setIsSwitching(false);
    }
  };

  if (loading || !user) {
    return (
      <AnimatePresence mode="wait">
        {!showSkeleton
          ? <ModernLoadingScreen key="loading" />
          : <DashboardSkeleton key="skeleton" />}
      </AnimatePresence>
    );
  }

  const firstBusiness = user.businesses_one?.[0];
  if (!firstBusiness) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  if (user.creator === 'Host' && user.active_business_key === '0') {
    return <NewAccount />;
  }

  const createdAt = firstBusiness.created_at
    ? dayjs(firstBusiness.created_at).format('MMMM D, YYYY')
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col flex-1 min-h-screen bg-gray-50"
    >
      <DashboardContent
        user={user}
        business={firstBusiness}
        createdAt={createdAt}
        locations={locations}
        locationsLoading={locationsLoading}
        activeLocationKey={activeLocationKey}
        isSwitching={isSwitching}
        onSwitchLocation={handleSwitchLocation}
      />
    </motion.div>
  );
}

export default withAuth(DashboardPage);