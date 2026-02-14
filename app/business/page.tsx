'use client';
import { useState, useEffect } from "react";
import Business from "../business/businesslist";

export default function DashboardPage({ user, loading }: { user: any; loading: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <Business />
      </div>
    </div>
  );
}