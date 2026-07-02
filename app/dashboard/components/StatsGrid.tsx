'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Receipt, Clock, TrendingUp } from 'lucide-react';

const STATS = [
  { label: 'Total revenue', value: '₦2.4M', trend: '+12.5%', up: true, icon: Coins, color: 'blue' },
  { label: 'Paid invoices', value: '38', trend: '+4 this mo.', up: true, icon: Receipt, color: 'green' },
  { label: 'Outstanding', value: '₦580K', trend: '3 overdue', up: false, icon: Clock, color: 'amber' },
  { label: 'Net profit', value: '₦1.1M', trend: '+8.3%', up: true, icon: TrendingUp, color: 'purple' },
];

const STAT_COLORS: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-700' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-700' },
};

export const StatsGrid: React.FC = () => (
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
            <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${
              s.up ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {s.trend}
            </span>
          </div>
          <p className="text-xl font-semibold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
        </motion.div>
      );
    })}
  </div>
);