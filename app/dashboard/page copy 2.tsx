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
  { label: 'Total revenue', value: '₦2.4M', trend: '+12.5%',      up: true,  icon: Coins,      color: 'blue'   },
  { label: 'Paid invoices', value: '38',     trend: '+4 this mo.', up: true,  icon: Receipt,    color: 'green'  },
  { label: 'Outstanding',   value: '₦580K',  trend: '3 overdue',   up: false, icon: Clock,      color: 'amber'  },
  { label: 'Net profit',    value: '₦1.1M',  trend: '+8.3%',       up: true,  icon: TrendingUp, color: 'purple' },
];

// All stat icon backgrounds are now white/light-gray, all icons black
const STAT_COLORS: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-gray-100', icon: 'text-gray-900' },
  green:  { bg: 'bg-gray-100', icon: 'text-gray-900' },
  amber:  { bg: 'bg-gray-100', icon: 'text-gray-900' },
  purple: { bg: 'bg-gray-100', icon: 'text-gray-900' },
};

const TRANSACTIONS = [
  { icon: ArrowDownLeft, type: 'in',   name: 'Bolaji Stores',        date: 'May 6 · Invoice #1042', amount: '+₦240K'  },
  { icon: ArrowUpRight,  type: 'out',  name: 'Office supplies',      date: 'May 5 · Expense',       amount: '−₦18.5K' },
  { icon: Clock,         type: 'pend', name: 'Okafor Holdings',      date: 'Due May 10 · #1039',    amount: '₦175K'   },
  { icon: ArrowDownLeft, type: 'in',   name: 'Nnamdi & Co',          date: 'May 3 · Invoice #1038', amount: '+₦390K'  },
  { icon: ArrowUpRight,  type: 'out',  name: 'Internet & utilities', date: 'May 1 · Recurring',     amount: '−₦42K'   },
];

// All transaction icon backgrounds white/gray, icons and amounts black
const TX_STYLES: Record<string, { wrap: string; icon: string; amt: string }> = {
  in:   { wrap: 'bg-gray-100', icon: 'text-gray-900', amt: 'text-gray-900' },
  out:  { wrap: 'bg-gray-100', icon: 'text-gray-900', amt: 'text-gray-900' },
  pend: { wrap: 'bg-gray-100', icon: 'text-gray-900', amt: 'text-gray-900' },
};

// All quick action icon backgrounds white/gray, icons black
const QUICK_ACTIONS = [
  { icon: Plus,      label: 'New invoice',    sub: 'Create & send instantly', bg: 'bg-gray-100', ic: 'text-gray-900' },
  { icon: Receipt,   label: 'Record expense', sub: 'Log a new payment',       bg: 'bg-gray-100', ic: 'text-gray-900' },
  { icon: LineChart, label: 'P&L report',     sub: 'Profit & loss summary',   bg: 'bg-gray-100', ic: 'text-gray-900' },
];

const WEEKS   = ['W1', 'W2', 'W3', 'W4', 'W5'];
const INCOME  = [320, 480, 290, 540, 410];
const EXPENSE = [180, 220, 160, 280, 190];
const MAX_VAL = Math.max(...INCOME);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#f5f5f4] p-4 space-y-4">
    <div className="bg-gray-200 rounded-2xl h-24 animate-pulse" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 h-56 animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 h-56 animate-pulse" />
    </div>
  </div>
);

// ─── Loading Screen ───────────────────────────────────────────────────────────

const ModernLoadingScreen: React.FC = () => {
  const messages = [
    'Loading your dashboard...',
    'Fetching business data...',
    'Preparing your workspace...',
    'Almost ready...',
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % messages.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-6"
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
          <motion.h2
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-xl font-bold text-gray-900 mb-2"
          >
            {messages[idx]}
          </motion.h2>
        </AnimatePresence>

        <p className="text-sm text-gray-400 mb-8">Setting up your personalized dashboard</p>

        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto">
          <motion.div
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full bg-gray-900 rounded-full"
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-xs text-gray-400">Tip: Customize your dashboard for quick access</p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Error State ──────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Store className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
      <p className="text-sm text-gray-400 mb-8 leading-relaxed">
        We encountered an issue loading your dashboard. Please check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
      >
        <Loader2 className="h-4 w-4" />
        Retry
      </button>
    </div>
  </div>
);

// ─── Active Business Card ─────────────────────────────────────────────────────

// ─── Active Business Card ─────────────────────────────────────────────────────

const ActiveBusinessCard: React.FC<{
  business: Business;
  createdAt: string;
  user: User;
  locationCount: number;
}> = ({ business, createdAt, user, locationCount }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
  >
    <div className="px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {business.logo ? (
            <img
              src={`http://localhost:8000/storage/${business.logo}`}
              alt={business.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-900 font-bold text-xl leading-none select-none">
              {business.business_name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-gray-900 font-semibold text-lg leading-tight">
              {business.business_name}
            </p>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
              <CircleCheck size={10} /> Active
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Welcome back, {user.name} · <span className="capitalize">{business.subscription_type}</span> plan
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {business.address && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate max-w-[160px]">{business.address}</span>
          </div>
        )}
        {business.phone && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Phone size={14} className="text-gray-400 flex-shrink-0" />
            {business.phone}
          </div>
        )}
        <div className="text-right">
          <p className="text-gray-400 text-[11px] uppercase tracking-wider">Member since</p>
          <p className="text-gray-700 text-sm font-medium">{createdAt}</p>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-100 px-6 py-3 flex items-center gap-2 bg-gray-50/50">
      <Building2 size={14} className="text-gray-400" />
      <p className="text-gray-500 text-sm">
        {locationCount} {locationCount === 1 ? 'location' : 'locations'} under this business
      </p>
    </div>
  </motion.div>
);

// ─── Location Card ────────────────────────────────────────────────────────────
// UPDATED: All location cards now have white background and black text only

const LocationCard: React.FC<{
  location: Location;
  isActive: boolean;
  isSwitching: boolean;
  onSwitch: (key: string) => void;
  index: number;
}> = ({ location, isActive, isSwitching, onSwitch, index }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    onClick={() => !isActive && onSwitch(location.location_key)}
    disabled={isSwitching}
    className={`w-full text-left rounded-2xl border p-4 transition-all duration-150 group relative
      ${isActive
        ? 'bg-white border-gray-300 shadow-sm cursor-default'  // White background for active, black text
        : 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-sm cursor-pointer'
      }
      ${isSwitching && !isActive ? 'opacity-60 pointer-events-none' : ''}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100`}>
        <MapPin size={16} className="text-gray-900" />
      </div>

      {isActive ? (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
          <CheckCircle2 size={10} className="text-gray-700" /> Current
        </span>
      ) : (
        <ArrowRight
          size={14}
          className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all mt-0.5"
        />
      )}
    </div>

    <p className="text-sm font-semibold mb-1 leading-tight text-gray-900">
      {location.location_name}
    </p>

    <p className="text-[11px] leading-snug line-clamp-2 flex items-start gap-0.5 text-gray-500">
      <MapPin size={10} className="mt-0.5 flex-shrink-0 text-gray-400" />
      {location.address}
    </p>

    {location.phone && (
      <p className="text-[11px] mt-1 flex items-center gap-0.5 text-gray-400">
        <Phone size={10} className="flex-shrink-0" />
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
}> = ({ locations, activeLocationKey, isSwitching, locationsLoading, onSwitch }) => {
  if (locationsLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Locations</p>
            <p className="text-xs text-gray-400 mt-0.5">Click a location to switch context</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!locations.length) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Building2 size={18} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">No locations yet</p>
        <p className="text-xs text-gray-400 mt-1">Add a location to start managing it here</p>
        <button className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
          <Plus size={12} /> Add your first location
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Locations</p>
          <p className="text-xs text-gray-400 mt-0.5">Click a location to switch context</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <Plus size={12} /> Add location
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {locations.map((loc, i) => (
          <div key={loc.id}>
            <LocationCard
              location={loc}
              isActive={loc.location_key === activeLocationKey}
              isSwitching={isSwitching}
              onSwitch={onSwitch}
              index={i}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Revenue Chart ────────────────────────────────────────────────────────────

const RevenueChart: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-semibold text-gray-900">Revenue overview — May 2026</p>
      <button className="flex items-center gap-1 text-xs text-gray-700 hover:underline">
        View report <ChevronRight size={13} />
      </button>
    </div>

    <div className="flex items-end gap-2 mb-2" style={{ height: 120 }}>
      {WEEKS.map((week, i) => {
        const inH = Math.round((INCOME[i] / MAX_VAL) * 96);
        const exH = Math.round((EXPENSE[i] / MAX_VAL) * 96);
        return (
          <div key={week} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-gray-500 font-medium">₦{INCOME[i]}K</span>
            <div className="flex items-end gap-0.5 w-full" style={{ height: 96 }}>
              <div
                className="flex-1 bg-gray-900 rounded-t-md hover:opacity-75 transition-opacity cursor-pointer"
                style={{ height: inH }}
              />
              <div
                className="flex-1 bg-gray-200 rounded-t-md hover:opacity-75 transition-opacity cursor-pointer"
                style={{ height: exH }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{week}</span>
          </div>
        );
      })}
    </div>

    <div className="flex items-center gap-4 mt-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-900 inline-block" /> Income
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> Expenses
      </div>
    </div>
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
  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f5f4]">

    <ActiveBusinessCard
      business={business}
      createdAt={createdAt}
      user={user}
      locationCount={locations.length}
    />

    <LocationsSection
      locations={locations}
      activeLocationKey={activeLocationKey}
      isSwitching={isSwitching}
      locationsLoading={locationsLoading}
      onSwitch={onSwitchLocation}
    />

    {/* Stat Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS.map((s, i) => {
        const { bg, icon } = STAT_COLORS[s.color];
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <s.icon size={17} className={icon} />
              </div>
              {/* trend badge: white bg, black text */}
              <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                {s.trend}
              </span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </motion.div>
        );
      })}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 space-y-3">
        <RevenueChart />

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Business', value: business.business_name },
            { label: 'Address',  value: business.address || '—' },
            { label: 'Phone',    value: business.phone   || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xs font-medium text-gray-900 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Recent transactions</p>
            <button className="flex items-center gap-1 text-xs text-gray-700 hover:underline">
              All <ChevronRight size={13} />
            </button>
          </div>
          {TRANSACTIONS.map((tx, i) => {
            const s = TX_STYLES[tx.type];
            return (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-none">
                <div className={`w-8 h-8 rounded-lg ${s.wrap} flex items-center justify-center flex-shrink-0`}>
                  <tx.icon size={14} className={s.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{tx.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{tx.date}</p>
                </div>
                <p className={`text-xs font-semibold flex-shrink-0 ${s.amt}`}>{tx.amount}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Quick actions</p>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-lg ${qa.bg} flex items-center justify-center flex-shrink-0`}>
                  <qa.icon size={14} className={qa.ic} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">{qa.label}</p>
                  <p className="text-[10px] text-gray-400">{qa.sub}</p>
                </div>
                <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
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

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setShowSkeleton(true), 2000);
      return () => clearTimeout(t);
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
      transition={{ duration: 0.25 }}
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