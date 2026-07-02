'use client';

import React from 'react';
import { Loader2, Store } from 'lucide-react';

interface ErrorStateProps {
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Store className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
      <p className="text-sm text-gray-400 mb-8 leading-relaxed">
        We encountered an issue loading your dashboard. Please check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
      >
        <Loader2 className="h-4 w-4" />
        Retry
      </button>
    </div>
  </div>
);