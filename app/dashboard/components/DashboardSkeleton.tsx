'use client';

import React from 'react';

export const DashboardSkeleton: React.FC = () => (
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