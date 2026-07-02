'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, CircleCheck, Building2, Calendar, ChevronRight } from 'lucide-react';
import type { Business, User } from '../types';

interface ActiveBusinessCardProps {
  business: Business;
  createdAt: string;
  user: User;
  locationCount: number;
}

export const ActiveBusinessCard: React.FC<ActiveBusinessCardProps> = ({
  business,
  createdAt,
  user,
  locationCount,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/50 shadow-lg"
  >
    {/* Subtle background pattern */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
    
    {/* Main Content */}
    <div className="relative px-6 py-5">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Business Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Logo Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden shadow-inner">
              {business.logo ? (
                <img
                  src={`http://localhost:8000/storage/${business.logo}`}
                  alt={business.business_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg leading-none select-none tracking-tight">
                  {business.business_name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {/* Active indicator dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
          </div>

          {/* Business Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white font-semibold text-base leading-tight truncate">
                {business.business_name}
              </h2>
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium">
                <CircleCheck size={10} />
                <span className="hidden sm:inline">Active</span>
              </span>
            </div>
            
            <p className="text-gray-300 text-xs truncate">
              Welcome back, <span className="text-white font-medium">{user.name}</span>
              <span className="text-gray-500 mx-1.5">•</span>
              <span className="text-gray-300 capitalize">{business.subscription_type}</span> plan
            </p>
          </div>
        </div>

        {/* Right: Meta Info (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
          {business.address && (
            <div className="flex items-center gap-2 text-gray-300 text-xs">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
                <MapPin size={14} className="text-gray-400" />
              </div>
              <span className="truncate max-w-[120px]">{business.address}</span>
            </div>
          )}
          
          {business.phone && (
            <div className="flex items-center gap-2 text-gray-300 text-xs">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
                <Phone size={14} className="text-gray-400" />
              </div>
              <span className="font-medium">{business.phone}</span>
            </div>
          )}

          <div className="h-8 w-px bg-gray-700/50" />

          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
              <Calendar size={14} className="text-gray-400" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Member since</p>
              <p className="text-gray-200 text-xs font-medium">{createdAt}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer: Location Count */}
    <div className="relative border-t border-gray-700/50 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
            <Building2 size={12} className="text-gray-400" />
          </div>
          <p className="text-gray-300 text-xs">
            <span className="text-white font-medium">{locationCount}</span>
            {' '}{locationCount === 1 ? 'location' : 'locations'} under this business
          </p>
        </div>
        
        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors">
          <span>Manage</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  </motion.div>
);