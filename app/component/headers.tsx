"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { ChevronDown, Menu, Search, Bell, User, Settings, LogOut, HelpCircle } from "lucide-react";
import { withAuth } from "@/hoc/withAuth";
import { api, withCsrf } from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================
interface User {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: string | number | undefined;
}

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  user: User;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Header: React.FC<HeaderProps> = ({ setSidebarOpen, user }) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CSRF-safe logout
  const handleLogout = async (): Promise<void> => {
    try {
      await withCsrf(() => api.post("/logout"));
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 md:px-6 py-2 flex items-center justify-between gap-3">
      {/* Left side - Menu button and Search */}
      <div className="flex items-center gap-3 flex-1">
        {/* Menu button */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Search */}
        <div className={`hidden sm:flex relative transition-all duration-200 ${searchFocused ? 'w-72' : 'w-56'}`}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={14} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2 pl-10 pr-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-sm placeholder-gray-300 font-medium"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right side - Icons and User menu */}
      <div className="flex items-center gap-1">
        {/* Search icon for mobile */}
        <button className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>

        {/* Help */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors hidden md:flex">
          <HelpCircle size={18} />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* User profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {/* Avatar with initials */}
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>

            {/* User info - Hidden on mobile */}
            <div className="hidden md:flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                {user?.name || "User"}
              </span>
              <span className="text-xs text-gray-400 truncate max-w-[120px]">
                {user?.role || "Member"}
              </span>
            </div>

            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-900/10 py-1.5 min-w-[240px] z-50 overflow-hidden"
              >
                {/* User info section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link href="/profile">
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2.5">
                      <User size={15} className="text-gray-400" />
                      My Account
                    </button>
                  </Link>
                  <Link href="/settings">
                    <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2.5">
                      <Settings size={15} className="text-gray-400" />
                      Settings
                    </button>
                  </Link>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-100 my-1" />

                {/* Sign out */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] text-gray-400 font-medium">© 2026 Listkeeper</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default memo(withAuth(Header));