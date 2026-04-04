'use client';
import { withAuth } from "@/hoc/withAuth";
import Dashboard from "./component/dashboard";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface DashboardPageProps {
  user: User;
}

function DashboardPage({}: DashboardPageProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col flex-1">
        {/* <Headers setSidebarOpen={setSidebarOpen} /> */}
        <Dashboard/>
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);