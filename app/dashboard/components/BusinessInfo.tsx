'use client';

import React from 'react';
import type { Business } from '../types';

interface BusinessInfoProps {
  business: Business;
}

export const BusinessInfo: React.FC<BusinessInfoProps> = ({ business }) => (
  <div className="grid grid-cols-3 gap-3">
    {[
      { label: 'Business', value: business.business_name },
      { label: 'Address', value: business.address || '—' },
      { label: 'Phone', value: business.phone || '—' },
    ].map(({ label, value }) => (
      <div key={label} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xs font-medium text-gray-800 truncate">{value}</p>
      </div>
    ))}
  </div>
);