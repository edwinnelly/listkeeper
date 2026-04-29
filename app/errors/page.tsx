'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowLeft, LogIn, Home, Sparkles } from 'lucide-react';

interface UnauthorizedPageProps {
  message?: string;
  showLogin?: boolean;
  showHome?: boolean;
  customTitle?: string;
}

interface Particle {
  id: number;
  width: string;
  height: string;
  top: string;
  left: string;
  animationDuration: string;
  animationDelay: string;
}

const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  message = "You don't have permission to access this resource. Please log in with appropriate credentials.",
  showLogin = true,
  showHome = true,
  customTitle = "Access Denied"
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Generate particles only on the client side
    const generatedParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      width: Math.random() * 4 + 2 + 'px',
      height: Math.random() * 4 + 2 + 'px',
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      animationDuration: `${Math.random() * 10 + 10}s`,
      animationDelay: `${Math.random() * 5}s`
    }));
    
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent"></div>
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
      </div>

      {/* Floating particles - only render after mount */}
      <div className="absolute inset-0 overflow-hidden">
        {mounted && particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-500/10"
            style={{
              width: particle.width,
              height: particle.height,
              top: particle.top,
              left: particle.left,
              animation: `float ${particle.animationDuration} linear infinite`,
              animationDelay: particle.animationDelay
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className={`relative w-full max-w-2xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
        
        {/* 403 Badge */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div>
            <div className="relative w-32 h-32 bg-[#1E293B] rounded-full border-2 border-blue-500/30 flex items-center justify-center group-hover:border-blue-500/50 transition-all duration-500">
              <Lock className="w-14 h-14 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
        </div>

        {/* Error Number */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400 tracking-wider">ERROR 403</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-blue mb-2 tracking-tight">
            {customTitle.split(' ').map((word, i) => (
              <span key={i} className={i === 1 ? 'text-blue-400' : ''}>
                {word}{' '}
              </span>
            ))}
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-transparent mx-auto mt-4"></div>
        </div>

        {/* Message */}
        <div className="bg-[#1E293B]/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-slate-300 leading-relaxed">{message}</p>
              <p className="text-slate-500 text-sm mt-2">
                If you believe this is a mistake, please verify your credentials or contact support.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="group relative px-6 py-4 bg-[#1E293B] hover:bg-[#1E293B]/80 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
              <span className="text-slate-300 font-medium">Dashboard</span>
            </div>
          </button>
          
          {showLogin && (
            <button
              onClick={() => router.push('/auth')}
              className="group relative px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Sign In</span>
              </div>
            </button>
          )}
          
          {showHome && (
            <button
              onClick={() => router.push('/')}
              className="group relative px-6 py-4 bg-[#1E293B] hover:bg-[#1E293B]/80 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 font-medium">Home</span>
              </div>
            </button>
          )}
        </div>

        {/* Support Link */}
        <div className="text-center mt-8">
          <a 
            href="/support" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 text-sm transition-colors group"
          >
            Need immediate help?
            <span className="text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10%, 90% {
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default UnauthorizedPage;