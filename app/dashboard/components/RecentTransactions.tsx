'use client';

import React from 'react';
import { ChevronRight, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';

const TRANSACTIONS = [
  { icon: ArrowDownLeft, type: 'in', name: 'Bolaji Stores', date: 'May 6 · Invoice #1042', amount: '+₦240K' },
  { icon: ArrowUpRight, type: 'out', name: 'Office supplies', date: 'May 5 · Expense', amount: '−₦18.5K' },
  { icon: Clock, type: 'pend', name: 'Okafor Holdings', date: 'Due May 10 · #1039', amount: '₦175K' },
  { icon: ArrowDownLeft, type: 'in', name: 'Nnamdi & Co', date: 'May 3 · Invoice #1038', amount: '+₦390K' },
  { icon: ArrowUpRight, type: 'out', name: 'Internet & utilities', date: 'May 1 · Recurring', amount: '−₦42K' },
];

const TX_STYLES: Record<string, { wrap: string; icon: string; amt: string }> = {
  in: { wrap: 'bg-green-50', icon: 'text-green-700', amt: 'text-green-700' },
  out: { wrap: 'bg-red-50', icon: 'text-red-600', amt: 'text-red-600' },
  pend: { wrap: 'bg-amber-50', icon: 'text-amber-700', amt: 'text-amber-700' },
};

export const RecentTransactions: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-semibold text-gray-900">Recent transactions</p>
      <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
        All <ChevronRight size={13} />
      </button>
    </div>
    {TRANSACTIONS.map((tx, i) => {
      const s = TX_STYLES[tx.type];
      return (
        <div key={i} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-none">
          <div className={`w-8 h-8 rounded-lg ${s.wrap} flex items-center justify-center flex-shrink-0`}>
            <tx.icon size={14} className={s.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{tx.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{tx.date}</p>
          </div>
          <p className={`text-xs font-semibold flex-shrink-0 ${s.amt}`}>{tx.amount}</p>
        </div>
      );
    })}
  </div>
);