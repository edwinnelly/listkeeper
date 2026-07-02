'use client';

import React from 'react';
import { ActiveBusinessCard } from './ActiveBusinessCard';
import { LocationsSection } from './LocationsSection';
import { StatsGrid } from './StatsGrid';
import { RevenueChart } from './RevenueChart';
import { RecentTransactions } from './RecentTransactions';
import { QuickActions } from './QuickActions';
import { BusinessInfo } from './BusinessInfo';
import type { User, Business, Location } from '../types';

interface DashboardContentProps {
  user: User;
  business: Business;
  createdAt: string;
  locations: Location[];
  locationsLoading: boolean;
  activeLocationKey: string | undefined;
  isSwitching: boolean;
  onSwitchLocation: (key: string) => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
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

    <StatsGrid />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 space-y-3">
        <RevenueChart />
        <BusinessInfo business={business} />
      </div>

      <div className="space-y-3">
        <RecentTransactions />
        <QuickActions />
      </div>
    </div>
  </div>
);