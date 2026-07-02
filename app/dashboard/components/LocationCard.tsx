'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import type { Location } from '../types';

interface LocationCardProps {
  location: Location;
  isActive: boolean;
  isSwitching: boolean;
  onSwitch: (key: string) => void;
  index: number;
}
 
export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isActive,
  isSwitching,
  onSwitch,
  index,
}) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
    onClick={() => !isActive && onSwitch(location.location_key)}
    disabled={isSwitching || isActive}
    className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 group relative
      ${isActive
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-lg cursor-default'
        : 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-md cursor-pointer hover:-translate-y-0.5'
      }
      ${isSwitching && !isActive ? 'opacity-50 pointer-events-none' : ''}`}
  >
    {/* Active indicator bar */}
    {isActive && (
      <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
    )}

    <div className="flex items-start justify-between mb-4">
      {/* Icon Container */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200
          ${isActive 
            ? 'bg-white/10 border border-white/10' 
            : 'bg-gray-50 border border-gray-100 group-hover:bg-gray-100 group-hover:border-gray-200'
          }`}
      >
        {isActive ? (
          <Building2 size={18} className="text-white" />
        ) : (
          <MapPin size={18} className="text-gray-500 group-hover:text-gray-700" />
        )}
      </div>

      {/* Status Badge */}
      {isActive ? (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium">
          <CheckCircle2 size={10} />
          Current
        </span>
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 group-hover:bg-gray-100 group-hover:border-gray-200 transition-all duration-200 group-hover:translate-x-0.5">
          <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600" />
        </span>
      )}
    </div>

    {/* Location Name */}
    <h3 className={`text-sm font-semibold mb-2 leading-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
      {location.location_name}
    </h3>

    {/* Address */}
    <div className={`flex items-start gap-1.5 text-xs leading-relaxed mb-2
      ${isActive ? 'text-gray-400' : 'text-gray-500'}`}
    >
      <MapPin size={12} className="mt-0.5 flex-shrink-0" />
      <span className="line-clamp-2">{location.address}</span>
    </div>

    {/* Phone (if exists) */}
    {location.phone && (
      <div className={`flex items-center gap-1.5 text-xs
        ${isActive ? 'text-gray-500' : 'text-gray-400'}`}
      >
        <Phone size={12} className="flex-shrink-0" />
        <span className="font-medium">{location.phone}</span>
      </div>
    )}

    {/* Inactive state hover prompt */}
    {!isActive && !isSwitching && (
      <div className="mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <p className="text-[10px] text-gray-400 font-medium">
          Click to switch to this location
        </p>
      </div>
    )}
  </motion.button>
);