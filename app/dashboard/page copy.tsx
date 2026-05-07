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
  MoreHorizontal,
  Calendar,
  Activity,
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

// ─── Placeholder Constants ────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Revenue',    value: '₦2.4M',  trend: '+12.5%',      up: true,  icon: Coins,      color: 'blue'   },
  { label: 'Paid Invoices',    value: '38',      trend: '+4 this mo.', up: true,  icon: Receipt,    color: 'green'  },
  { label: 'Outstanding',      value: '₦580K',   trend: '3 overdue',   up: false, icon: Clock,      color: 'amber'  },
  { label: 'Net Profit',       value: '₦1.1M',   trend: '+8.3%',       up: true,  icon: TrendingUp, color: 'purple' },
];

const STAT_COLORS: Record<string, { bg: string; icon: string; ring: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'ring-blue-100'   },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  ring: 'ring-green-100'  },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'ring-amber-100'  },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
};

const TRANSACTIONS = [
  { icon: ArrowDownLeft, type: 'in',   name: 'Bolaji Stores',        date: 'May 6 · Invoice #1042', amount: '+₦240K'  },
  { icon: ArrowUpRight,  type: 'out',  name: 'Office Supplies',      date: 'May 5 · Expense',       amount: '−₦18.5K' },
  { icon: Clock,         type: 'pend', name: 'Okafor Holdings',      date: 'Due May 10 · #1039',    amount: '₦175K'   },
  { icon: ArrowDownLeft, type: 'in',   name: 'Nnamdi & Co',          date: 'May 3 · Invoice #1038', amount: '+₦390K'  },
  { icon: ArrowUpRight,  type: 'out',  name: 'Internet & Utilities', date: 'May 1 · Recurring',     amount: '−₦42K'   },
];

const TX_STYLES: Record<string, { wrap: string; icon: string; amt: string }> = {
  in:   { wrap: 'bg-emerald-50', icon: 'text-emerald-600', amt: 'text-emerald-700' },
  out:  { wrap: 'bg-red-50',     icon: 'text-red-500',     amt: 'text-red-600'     },
  pend: { wrap: 'bg-amber-50',   icon: 'text-amber-600',   amt: 'text-amber-700'   },
};

const QUICK_ACTIONS = [
  { icon: Plus,      label: 'New Invoice',    sub: 'Create & send instantly', bg: 'bg-blue-50',   ic: 'text-blue-600'   },
  { icon: Receipt,   label: 'Record Expense', sub: 'Log a new payment',       bg: 'bg-green-50',  ic: 'text-green-600'  },
  { icon: LineChart, label: 'P&L Report',     sub: 'Profit & loss summary',   bg: 'bg-purple-50', ic: 'text-purple-600' },
];

const WEEKS   = ['W1', 'W2', 'W3', 'W4', 'W5'];
const INCOME  = [320, 480, 290, 540, 410];
const EXPENSE = [180, 220, 160, 280, 190];
const MAX_VAL = Math.max(...INCOME);

// ─── API base URL (fixes hardcoded localhost) ─────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Pulse: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#f5f5f4] p-5 space-y-5">
    <Pulse className="h-28 rounded-2xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <Pulse key={i} className="h-32" />)}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <Pulse key={i} className="h-36" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Pulse className="lg:col-span-2 h-64" />
      <Pulse className="h-64" />
    </div>
  </div>
);

// ─── Loading Screen ───────────────────────────────────────────────────────────

const ModernLoadingScreen: React.FC = () => {
  const messages = [
    'Loading your dashboard…',
    'Fetching business data…',
    'Preparing your workspace…',
    'Almost ready…',
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % messages.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm mx-auto px-6"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-20 h-20 mx-auto mb-8"
        >
          <div className="absolute inset-0 rounded-2xl bg-gray-900" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-3 rounded-2xl border-2 border-dashed border-gray-300/50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <LayoutDashboard className="h-9 w-9 text-white" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-lg font-semibold text-gray-900 mb-1"
          >
            {messages[idx]}
          </motion.p>
        </AnimatePresence>

        <p className="text-sm text-gray-400 mb-8">Setting up your personalized workspace</p>

        <div className="h-1 bg-gray-200 rounded-full overflow-hidden max-w-[200px] mx-auto">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/2 bg-gray-900 rounded-full"
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-xs text-gray-400">Tip: Customize your dashboard for quick access</p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Error State ──────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center p-6">
    <div className="text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Store className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1.5">Failed to load dashboard</h2>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Something went wrong loading your dashboard. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-95 transition-all"
      >
        <Loader2 className="h-4 w-4" />
        Retry
      </button>
    </div>
  </div>
);

// ─── Active Business Card ─────────────────────────────────────────────────────

const ActiveBusinessCard: React.FC<{
  business: Business;
  createdAt: string;
  user: User;
  locationCount: number;
}> = ({ business, createdAt, user, locationCount }) => {
  const initials = business.business_name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-[#111827] rounded-2xl overflow-hidden"
    >
      {/* Subtle mesh overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative px-5 pt-5 pb-4 flex items-start gap-4">
        {/* Logo / Initials */}
        <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/[0.1] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {business.logo ? (
            <img
              src={`${API_BASE}/storage/${business.logo}`}
              alt={business.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-xl leading-none select-none">
              {initials}
            </span>
          )}
        </div>

        {/* Core info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold text-base leading-tight truncate">
              {business.business_name}
            </p>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-medium flex-shrink-0">
              <CircleCheck size={9} strokeWidth={2.5} /> Active
            </span>
          </div>
          <p className="text-white/60 text-xs mb-3">
            Welcome back, <span className="text-white/60 font-medium">{user.name}</span>
            {' '}·{' '}
            <span className="capitalize">{business.subscription_type}</span> plan
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {business.address && (
              <span className="flex items-center gap-1 text-white/60 text-xs">
                <MapPin size={11} className="text-white/60 flex-shrink-0" />
                <span className="truncate max-w-[160px]">{business.address}</span>
              </span>
            )}
            {business.phone && (
              <span className="flex items-center gap-1 text-white/60 text-xs">
                <Phone size={11} className="text-white/60 flex-shrink-0" />
                {business.phone}
              </span>
            )}
            {createdAt && (
              <span className="flex items-center gap-1 text-white/35 text-xs">
                <Calendar size={11} className="text-white/60 flex-shrink-0" />
                Since {createdAt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="relative border-t border-white/[0.06] px-5 py-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-white/30 text-xs">
          <Building2 size={11} />
          {locationCount} {locationCount === 1 ? 'location' : 'locations'} registered
        </span>
        <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
          {user.creator}
        </span>
      </div>
    </motion.div>
  );
};

// ─── Location Card ────────────────────────────────────────────────────────────

const LocationCard: React.FC<{
  location: Location;
  isActive: boolean;
  isSwitching: boolean;
  onSwitch: (key: string) => void;
  index: number;
}> = ({ location, isActive, isSwitching, onSwitch, index }) => (
  <motion.button
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={() => !isActive && onSwitch(location.location_key)}
    disabled={isSwitching}
    className={[
      'w-full text-left rounded-2xl border p-4 transition-all duration-200 group relative',
      isActive
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm active:scale-[0.98] cursor-pointer',
      isSwitching && !isActive ? 'opacity-50 pointer-events-none' : '',
    ].join(' ')}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
        ${isActive ? 'bg-white/10' : 'bg-gray-50 group-hover:bg-gray-100 transition-colors'}`}
      >
        <MapPin size={14} className={isActive ? 'text-white/70' : 'text-gray-400'} />
      </div>

      {isActive ? (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">
          <CheckCircle2 size={9} /> Current
        </span>
      ) : (
        <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
      )}
    </div>

    <p className={`text-sm font-semibold leading-tight mb-1 ${isActive ? 'text-white' : 'text-gray-900'}`}>
      {location.location_name}
    </p>
    <p className={`text-[11px] leading-snug line-clamp-2 ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
      {location.address}
    </p>
    {location.phone && (
      <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${isActive ? 'text-white/30' : 'text-gray-400'}`}>
        <Phone size={9} className="flex-shrink-0" />
        {location.phone}
      </p>
    )}
  </motion.button>
);

// ─── Locations Section ────────────────────────────────────────────────────────

const LocationsSection: React.FC<{
  locations: Location[];
  activeLocationKey: string | undefined;
  isSwitching: boolean;
  locationsLoading: boolean;
  onSwitch: (key: string) => void;
}> = ({ locations, activeLocationKey, isSwitching, locationsLoading, onSwitch }) => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Locations</h2>
        <p className="text-xs text-gray-400 mt-0.5">Click a card to switch working context</p>
      </div>
      <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-all hover:bg-white">
        <Plus size={12} /> Add location
      </button>
    </div>

    {locationsLoading ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(3)].map((_, i) => <Pulse key={i} className="h-32" />)}
      </div>
    ) : !locations.length ? (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Building2 size={18} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-600">No locations yet</p>
        <p className="text-xs text-gray-400 mt-1 mb-4">Add a location to start managing it here</p>
        <button className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
          <Plus size={12} /> Add your first location
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {locations.map((loc, i) => (
          <LocationCard
            key={loc.id}
            location={loc}
            isActive={loc.location_key === activeLocationKey}
            isSwitching={isSwitching}
            onSwitch={onSwitch}
            index={i}
          />
        ))}
      </div>
    )}
  </section>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string;
  trend: string;
  up: boolean;
  icon: React.ElementType;
  color: string;
  delay: number;
}> = ({ label, value, trend, up, icon: Icon, color, delay }) => {
  const { bg, icon, ring } = STAT_COLORS[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${bg} ring-1 ${ring} flex items-center justify-center`}>
          <Icon size={16} className={icon} />
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          up ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
};

// ─── Revenue Chart ────────────────────────────────────────────────────────────

const RevenueChart: React.FC = () => {
  const totalIncome  = INCOME.reduce((a, b) => a + b, 0);
  const totalExpense = EXPENSE.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Revenue Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">May 2026 · Weekly breakdown</p>
        </div>
        <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
          Full report <ChevronRight size={12} />
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-gray-900" />
          <span className="text-xs text-gray-500">Income</span>
          <span className="text-xs font-semibold text-gray-900">₦{totalIncome}K</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-500">Expenses</span>
          <span className="text-xs font-semibold text-gray-900">₦{totalExpense}K</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2" style={{ height: 110 }}>
        {WEEKS.map((week, i) => {
          const inH  = Math.round((INCOME[i]  / MAX_VAL) * 88);
          const exH  = Math.round((EXPENSE[i] / MAX_VAL) * 88);
          return (
            <div key={week} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[9px] text-gray-400 font-medium">₦{INCOME[i]}K</span>
              <div className="flex items-end gap-0.5 w-full" style={{ height: 88 }}>
                <div
                  title={`Income: ₦${INCOME[i]}K`}
                  className="flex-1 bg-gray-900 rounded-t-md hover:bg-gray-700 transition-colors cursor-pointer"
                  style={{ height: inH }}
                />
                <div
                  title={`Expense: ₦${EXPENSE[i]}K`}
                  className="flex-1 bg-gray-200 rounded-t-md hover:bg-gray-300 transition-colors cursor-pointer"
                  style={{ height: exH }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{week}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Transactions Panel ───────────────────────────────────────────────────────

const TransactionsPanel: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
        <p className="text-xs text-gray-400 mt-0.5">Last 5 activities</p>
      </div>
      <button className="flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
        View all <ChevronRight size={12} />
      </button>
    </div>

    <div className="space-y-1">
      {TRANSACTIONS.map((tx, i) => {
        const s = TX_STYLES[tx.type];
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group cursor-default"
          >
            <div className={`w-8 h-8 rounded-lg ${s.wrap} flex items-center justify-center flex-shrink-0`}>
              <tx.icon size={13} className={s.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{tx.name}</p>
              <p className="text-[10px] text-gray-400">{tx.date}</p>
            </div>
            <p className={`text-xs font-bold flex-shrink-0 ${s.amt}`}>{tx.amount}</p>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Quick Actions Panel ──────────────────────────────────────────────────────

const QuickActionsPanel: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
    <div className="space-y-2">
      {QUICK_ACTIONS.map((qa) => (
        <button
          key={qa.label}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all text-left group"
        >
          <div className={`w-8 h-8 rounded-lg ${qa.bg} flex items-center justify-center flex-shrink-0`}>
            <qa.icon size={14} className={qa.ic} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900">{qa.label}</p>
            <p className="text-[10px] text-gray-400">{qa.sub}</p>
          </div>
          <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </button>
      ))}
    </div>
  </div>
);

// ─── Business Info Strip ──────────────────────────────────────────────────────

const BusinessInfoStrip: React.FC<{ business: Business }> = ({ business }) => (
  <div className="grid grid-cols-3 gap-3">
    {[
      { label: 'Business', value: business.business_name },
      { label: 'Address',  value: business.address || '—' },
      { label: 'Phone',    value: business.phone   || '—' },
    ].map(({ label, value }) => (
      <div key={label} className="bg-white rounded-xl px-4 py-3 border border-gray-100">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xs font-semibold text-gray-800 truncate">{value}</p>
      </div>
    ))}
  </div>
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
}> = ({ user, business, createdAt, locations, locationsLoading, activeLocationKey, isSwitching, onSwitchLocation }) => (
  <div className="flex-1 overflow-y-auto bg-[#f5f5f4]">
    <div className="max-w-screen-xl mx-auto p-4 md:p-5 space-y-5">

      <ActiveBusinessCard
        business={business}
        createdAt={createdAt}
        user={user}
        locationCount={locations.length}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.05} />
        ))}
      </div>

      <LocationsSection
        locations={locations}
        activeLocationKey={activeLocationKey}
        isSwitching={isSwitching}
        locationsLoading={locationsLoading}
        onSwitch={onSwitchLocation}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-4">
          <RevenueChart />
          <BusinessInfoStrip business={business} />
        </div>

        {/* Right col */}
        <div className="space-y-4">
          <TransactionsPanel />
          <QuickActionsPanel />
        </div>
      </div>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage({ user, loading }: { user: User | null; loading: boolean }): React.ReactElement {
  const [showSkeleton, setShowSkeleton]           = useState(false);
  const [locations, setLocations]                 = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading]   = useState(true);
  const [isSwitching, setIsSwitching]             = useState(false);
  const [activeLocationKey, setActiveLocationKey] = useState<string | undefined>(
    user?.active_location_key
  );

  // Show skeleton after 2 s of loading so we don't flash it on fast connections
  useEffect(() => {
    if (!loading) { setShowSkeleton(false); return; }
    const t = setTimeout(() => setShowSkeleton(true), 2000);
    return () => clearTimeout(t);
  }, [loading]);

  // Sync active location when user object changes
  useEffect(() => {
    if (user?.active_location_key) setActiveLocationKey(user.active_location_key);
  }, [user?.active_location_key]);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await apiGet('/locations');
      const raw =
        res?.data?.data?.locations ??
        res?.data?.data ??
        res?.data?.locations ??
        res?.data?.location ??
        [];
      setLocations(Array.isArray(raw) ? raw : []);
    } catch {
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) fetchLocations();
  }, [loading, user, fetchLocations]);

  // BUG FIX: was calling apiGet to switch location — should be apiPut/apiPost
  const handleSwitchLocation = async (locationKey: string) => {
    const previous = activeLocationKey;
    setActiveLocationKey(locationKey);   // Optimistic update
    setIsSwitching(true);
    try {
      await apiPut('/locations/switch', { location_key: locationKey });
    } catch (err) {
      console.error('Failed to switch location:', err);
      setActiveLocationKey(previous);    // Rollback on failure
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
    ? dayjs(firstBusiness.created_at).format('MMM D, YYYY')
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col flex-1 min-h-screen bg-[#f5f5f4]"
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