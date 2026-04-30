'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowLeft, LogIn, Home, HelpCircle } from 'lucide-react';

interface UnauthorizedPageProps {
  message?: string;
  showLogin?: boolean;
  showHome?: boolean;
  customTitle?: string;
}

const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  message = "You don't have permission to access this resource. Please log in with appropriate credentials.",
  showLogin = true,
  showHome = true,
  customTitle = "Access Denied"
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className={`relative w-full max-w-2xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Status Badge */}
        <div className="flex justify-center mb-10">
          <div className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center">
            <Lock className="w-10 h-10 text-gray-900" />
          </div>
        </div>

        {/* Error Label */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
            <span className="text-xs font-medium text-gray-500 tracking-wider uppercase">Error 403</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-4 tracking-tight">
            {customTitle}
          </h1>
          
          <div className="w-16 h-px bg-gray-200 mx-auto"></div>
        </div>

        {/* Message Card */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 mb-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600 leading-relaxed">{message}</p>
              <p className="text-gray-400 text-sm">
                If you believe this is a mistake, please verify your credentials or contact support.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="group px-6 py-3.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm font-medium text-gray-700">Dashboard</span>
            </div>
          </button>
          
          {showLogin && (
            <button
              onClick={() => router.push('/appfaq')}
              className="group px-6 py-3.5 bg-gray-900 hover:bg-gray-800 rounded-xl transition-all duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Need Help</span>
              </div>
            </button>
          )}
          
          {showHome && (
            <button
              onClick={() => router.push('/')}
              className="group px-6 py-3.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium text-gray-700">Home</span>
              </div>
            </button>
          )}
        </div>

        {/* Support Link */}
        <div className="text-center mt-10">
          <a 
            href="/appfaq" 
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors group"
          >
            Need immediate help?
            <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;