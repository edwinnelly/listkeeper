'use client';

import React from 'react';
import { ChevronRight, Plus, Receipt, LineChart } from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: Plus, label: 'New invoice', sub: 'Create & send instantly', bg: 'bg-blue-50', ic: 'text-blue-700' },
  { icon: Receipt, label: 'Record expense', sub: 'Log a new payment', bg: 'bg-green-50', ic: 'text-green-700' },
  { icon: LineChart, label: 'P&L report', sub: 'Profit & loss summary', bg: 'bg-purple-50', ic: 'text-purple-700' },
];

export const QuickActions: React.FC = () => (
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
);