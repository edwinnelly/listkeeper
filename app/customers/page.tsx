'use client';

import Customer from "./manage_customer";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col flex-1">
        <Customer />
      </div>
    </div>
  );
}