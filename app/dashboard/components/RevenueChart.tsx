'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5'];
const INCOME = [320, 480, 290, 540, 410];
const EXPENSE = [180, 220, 160, 280, 190];
const MAX_VAL = Math.max(...INCOME);

export const RevenueChart: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-semibold text-gray-900">Revenue overview — May 2026</p>
      <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
        View report <ChevronRight size={13} />
      </button>
    </div>

    <div className="flex items-end gap-2 mb-2" style={{ height: 120 }}>
      {WEEKS.map((week, i) => {
        const inH = Math.round((INCOME[i] / MAX_VAL) * 96);
        const exH = Math.round((EXPENSE[i] / MAX_VAL) * 96);
        return (
          <div key={week} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-gray-500 font-medium">₦{INCOME[i]}K</span>
            <div className="flex items-end gap-0.5 w-full" style={{ height: 96 }}>
              <div
                className="flex-1 bg-gray-900 rounded-t-md hover:opacity-75 transition-opacity cursor-pointer"
                style={{ height: inH }}
              />
              <div
                className="flex-1 bg-gray-200 rounded-t-md hover:opacity-75 transition-opacity cursor-pointer"
                style={{ height: exH }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{week}</span>
          </div>
        );
      })}
    </div>

    <div className="flex items-center gap-4 mt-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-900 inline-block" /> Income
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> Expenses
      </div>
    </div>
  </div>
);