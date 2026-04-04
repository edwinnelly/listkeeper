'use client';

import Business from "../business/businesslist";

// Remove the DashboardPageProps interface entirely since you're not using props
export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <Business />
      </div>
    </div>
  );
}