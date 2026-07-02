'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { withAuth } from '@/hoc/withAuth';
import { apiGet } from "@/lib/axios";
import NewAccount from '../component/newAccount';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernLoadingScreen } from './components/ModernLoadingScreen';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ErrorState } from './components/ErrorState';
import { DashboardContent } from './components/DashboardContent';
import type { User, Location } from './types/index';

function DashboardPage({ user, loading }: { user: User | null; loading: boolean }): React.ReactElement {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activeLocationKey, setActiveLocationKey] = useState<string | undefined>(
    user?.active_location_key
  );

  // Show skeleton after 2s delay to avoid flash of loading screen
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowSkeleton(true), 2000);
      return () => clearTimeout(timer);
    }
    setShowSkeleton(false);
  }, [loading]);

  // Sync active location from user preferences
  useEffect(() => {
    if (user?.active_location_key) {
      setActiveLocationKey(user.active_location_key);
    }
  }, [user?.active_location_key]);

  // Fetch locations with graceful fallback for various API response structures
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

  // Fetch locations when auth is complete and user is available
  useEffect(() => {
    if (!loading && user) {
      fetchLocations();
    }
  }, [loading, user, fetchLocations]);

  // Optimistic location switch with rollback on failure
  const handleSwitchLocation = async (locationKey: string) => {
    const previous = activeLocationKey;
    setActiveLocationKey(locationKey);
    setIsSwitching(true);
    
    try {
      await apiGet('/locations', { location_key: locationKey });
    } catch (err) {
      console.error('Failed to switch location:', err);
      setActiveLocationKey(previous); // Rollback on failure
    } finally {
      setIsSwitching(false);
    }
  };

  // Loading state: show animated loader first, then skeleton after 2s
  if (loading || !user) {
    return (
      <AnimatePresence mode="wait">
        {!showSkeleton ? (
          <ModernLoadingScreen key="loading" />
        ) : (
          <DashboardSkeleton key="skeleton" />
        )}
      </AnimatePresence>
    );
  }

  // Error state: no business data available
  const firstBusiness = user.businesses_one?.[0];
  if (!firstBusiness) {
    return <NewAccount />;
    // return <ErrorState onRetry={() => window.location.reload()} />;
  }

  // Onboarding state: new host user without a business
  if (user.creator === 'Host' && user.active_business_key === '0') {
    return <NewAccount />;
  }

  // Format creation date for display
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