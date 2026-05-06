'use client';

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/hoc/withAuth';
import Dashboard from '../component/dashboard';
import NewAccount from '../component/newAccount';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Building2, 
  Store, 
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';

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
  business_key: string;
  businesses_one?: Business[];
  about_business: string;
}

// ============================================================
// Loading Skeleton
// ============================================================
const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#f5f5f4]">
    {/* Header Skeleton */}
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div>
            <div className="h-5 w-40 bg-gray-100 rounded-lg animate-pulse mb-2" />
            <div className="h-3 w-24 bg-gray-50 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-9 w-9 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-9 w-24 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </header>

    {/* Stats Skeleton */}
    <main className="max-w-screen-2xl mx-auto px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-20 bg-gray-100 rounded-lg animate-pulse mb-2" />
                <div className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="h-5 w-24 bg-gray-100 rounded-lg animate-pulse mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

// ============================================================
// Modern Loading Screen
// ============================================================
const ModernLoadingScreen: React.FC = () => {
  const loadingMessages = [
    "Loading your dashboard...",
    "Fetching business data...",
    "Preparing your workspace...",
    "Almost ready...",
  ];

  const [messageIndex, setMessageIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#f5f5f4] to-gray-100 flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [-20, 20, -20],
            y: [-10, 10, -10],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-900/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [10, -10, 10],
            y: [5, -5, 5],
            rotate: [0, -3, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gray-600/5 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-md mx-auto px-6"
      >
        {/* Animated Logo Area */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-24 h-24 mx-auto mb-8"
        >
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 shadow-xl shadow-gray-900/20" />
          
          {/* Inner Ring Animation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-3 rounded-2xl border-2 border-dashed border-gray-300/50"
          />
          
          {/* Gradient Overlay */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"
          />
          
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <LayoutDashboard className="h-10 w-10 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {loadingMessages[messageIndex]}
          </h2>
        </motion.div>

        <p className="text-sm text-gray-400 mb-8">
          Setting up your personalized dashboard
        </p>

        {/* Progress Bar */}
        <div className="relative w-full max-w-xs mx-auto">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              animate={{
                width: ["0%", "100%"],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full bg-gradient-to-r from-gray-600 via-gray-900 to-gray-600 rounded-full"
            />
          </div>
        </div>

        {/* Small loading tips */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-xs text-gray-400">
            Tip: Customize your dashboard for quick access
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================
// Error State
// ============================================================
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md mx-auto px-6"
    >
      <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Store className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
      <p className="text-sm text-gray-400 mb-8 leading-relaxed">
        We encountered an issue while loading your dashboard. Please check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"
      >
        <Loader2 className="h-4 w-4" />
        Retry
      </button>
    </motion.div>
  </div>
);

// ============================================================
// Welcome Card
// ============================================================
const WelcomeCard: React.FC<{ user: User; business: Business }> = ({ user, business }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6"
  >
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Welcome back, {user.name}!</h2>
          <p className="text-sm text-gray-300">
            {business.business_name} • {business.subscription_type} plan
          </p>
        </div>
      </div>
    </div>
    <div className="px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Quick Overview</p>
          <p className="text-xs text-gray-400">Your business is active and running</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          ACTIVE
        </span>
      </div>
    </div>
  </motion.div>
);

// ============================================================
// Main Dashboard Page
// ============================================================
function DashboardPage({ user, loading }: { user: User | null; loading: boolean }): React.ReactElement {
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Show loading screen for first 2 seconds, then skeleton
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [loading]);

  const handleRetry = (): void => {
    setRetryCount((prev) => prev + 1);
    window.location.reload();
  };

  // Loading state with transition
  if (loading || !user) {
    return (
      <AnimatePresence mode="wait">
        {!showSkeleton ? (
          <ModernLoadingScreen key="loading-screen" />
        ) : (
          <DashboardSkeleton key="skeleton" />
        )}
      </AnimatePresence>
    );
  }

  // Error state (if user has no businesses after loading)
  const firstBusiness = user.businesses_one?.[0];

  if (!firstBusiness) {
    return <ErrorState onRetry={handleRetry} />;
  }

  const createdAt = firstBusiness.created_at
    ? dayjs(firstBusiness.created_at).format('MMMM D, YYYY')
    : '';

  // Host with no business setup
  if (user.creator === 'Host' && user.active_business_key === '0') {
    return <NewAccount />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-1"
    >
      {/* Welcome Card */}
      <div className="max-w-screen-2xl mx-auto px-6 pt-6 w-full">
        <WelcomeCard user={user} business={firstBusiness} />
      </div>

      {/* Main Dashboard Component */}
      <Dashboard
        user={user}
        logo={firstBusiness.logo || ''}
        business_name={firstBusiness.business_name || ''}
        about_business={firstBusiness.about_business || ''}
        address={firstBusiness.address || ''}
        phone={firstBusiness.phone || ''}
        subscription_type={firstBusiness.subscription_type || ''}
        created_at={createdAt}
      />
    </motion.div>
  );
}

export default withAuth(DashboardPage);