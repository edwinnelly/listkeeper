'use client';
import { useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Sidebar from "../component/sidebar";
import Headers from "../component/headers";
import ManageProductCategories from "../productsecat/productscat";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-100">
    
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <ManageProductCategories />
      </div>
    </div>
  );
}

