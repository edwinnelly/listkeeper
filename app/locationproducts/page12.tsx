'use client';
import { useState } from "react";
import Productlist from "./[id]/page";

export default function DashboardPage() {
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-100">
    
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <Productlist />
      </div>
    </div>
  );
}

