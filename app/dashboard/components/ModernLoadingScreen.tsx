'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Sparkles } from 'lucide-react';

export const ModernLoadingScreen: React.FC = () => {
  const messages = [
    'Loading your dashboard...',
    'Fetching business data...',
    'Preparing your workspace...',
    'Almost ready...',
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % messages.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-6"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-20 h-20 mx-auto mb-8"
        >
          <div className="absolute inset-0 rounded-2xl bg-gray-900" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-3 rounded-2xl border-2 border-dashed border-gray-300/50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <LayoutDashboard className="h-9 w-9 text-white" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.h2
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-xl font-bold text-gray-900 mb-2"
          >
            {messages[idx]}
          </motion.h2>
        </AnimatePresence>

        <p className="text-sm text-gray-400 mb-8">Setting up your personalized dashboard</p>

        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto">
          <motion.div
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full bg-gray-900 rounded-full"
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-xs text-gray-400">Tip: Customize your dashboard for quick access</p>
        </div>
      </motion.div>
    </div>
  );
};