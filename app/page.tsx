
'use client';
import { useState } from "react";
import { withAuth } from "@/hoc/withAuth";
import Dashboard from "./component/dashboard";

function DashboardPage({ user }: { user: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}
      <div className="flex flex-col flex-1">
        {/* <Headers setSidebarOpen={setSidebarOpen} /> */}
        <Dashboard />
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);

