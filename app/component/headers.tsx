"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { ChevronDown, Menu, Search, Bell, User, Settings, LogOut } from "lucide-react";
import { withAuth } from "@/hoc/withAuth";
import { api, withCsrf } from "@/lib/axios";

const Header = ({ setSidebarOpen, user }: { setSidebarOpen: (open: boolean) => void; user: any }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CSRF-safe logout
  const handleLogout = async () => {
    try {
      await withCsrf(() => api.post("/logout"));
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f3f2f1] border-b border-[#e1dfdd] px-4 md:px-6 py-2 flex items-center justify-between gap-3 h-[48px]">
      {/* Left side - Menu button and Search */}
      <div className="flex items-center gap-4 flex-1">
        {/* Menu button */}
        <button
          className="p-2 rounded hover:bg-[#e1dfdd] transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} className="text-[#323130]" />
        </button>

        {/* Microsoft-style Search */}
        <div className={`hidden sm:flex relative transition-all duration-200 ${searchFocused ? 'w-80' : 'w-60'}`}>
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search size={16} className="text-[#605e5c]" />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full py-1.5 pl-9 pr-3 bg-white border border-[#c8c6c4] rounded-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] text-sm"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right side - Icons and User menu */}
      <div className="flex items-center gap-1">
        {/* Icons container */}
        <div className="flex items-center">
          {/* Search icon for mobile */}
          <button className="sm:hidden p-2 rounded hover:bg-[#e1dfdd]">
            <Search size={20} className="text-[#323130]" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded hover:bg-[#e1dfdd] transition-colors group">
            <Bell size={20} className="text-[#323130]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d13438] rounded-full border border-white"></span>
            <div className="absolute -bottom-8 right-0 bg-[#323130] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Notifications
            </div>
          </button>

          {/* Settings */}
          <button className="p-2 rounded hover:bg-[#e1dfdd] transition-colors group">
            <Settings size={20} className="text-[#323130]" />
            <div className="absolute -bottom-8 right-0 bg-[#323130] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Settings
            </div>
          </button>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[#e1dfdd] mx-1"></div>

        {/* User profile - Microsoft style */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 p-1 rounded hover:bg-[#e1dfdd] transition-colors group"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {/* Avatar with initials */}
            <div className="w-7 h-7 rounded-full bg-[#0078d4] flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>

            {/* User info - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-normal text-[#323130]">{user?.name}</span>
              <span className="text-xs text-[#605e5c]">{user?.role}</span>
            </div>

            <ChevronDown
              size={16}
              className={`text-[#605e5c] transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* Microsoft-style Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg border border-[#e1dfdd] rounded-sm py-1 min-w-[264px] z-50">
              {/* User info section */}
              <div className="px-3 py-2 border-b border-[#e1dfdd]">
                <p className="text-sm font-semibold text-[#323130]">{user?.name}</p>
                <p className="text-xs text-[#605e5c] truncate">{user?.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button className="w-full text-left px-3 py-2 text-sm text-[#323130] hover:bg-[#f3f2f1] flex items-center gap-2">
                  <User size={16} className="text-[#605e5c]" />
                  My account
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-[#323130] hover:bg-[#f3f2f1] flex items-center gap-2">
                  <Settings size={16} className="text-[#605e5c]" />
                  Settings
                </button>
              </div>

              {/* Separator */}
              <div className="border-t border-[#e1dfdd] my-1"></div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-[#323130] hover:bg-[#f3f2f1] flex items-center gap-2"
              >
                <LogOut size={16} className="text-[#605e5c]" />
                Sign out
              </button>

              {/* Footer with app info */}
              <div className="px-3 py-2 border-t border-[#e1dfdd]">
                <p className="text-xs text-[#605e5c]">© 202 Microsoft</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default memo(withAuth(Header));