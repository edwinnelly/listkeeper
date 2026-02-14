'use client';
import { useState } from "react";
import UsersTable from "./edit";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-100">
      
      <div className="flex flex-col flex-1">
      
        <UsersTable />
      </div>
    </div>
  );
}
