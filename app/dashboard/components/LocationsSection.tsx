'use client';

import React from 'react';
import { Plus, Building2 } from 'lucide-react';
import { LocationCard } from './LocationCard';
import type { Location } from '../types';

interface LocationsSectionProps {
  locations: Location[];
  activeLocationKey: string | undefined;
  isSwitching: boolean;
  locationsLoading: boolean;
  onSwitch: (key: string) => void;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({
  locations,
  activeLocationKey,
  isSwitching,
  locationsLoading,
  onSwitch,
}) => {
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
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Building2 size={18} className="text-gray-300" />
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