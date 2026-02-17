'use client';
import { useState } from "react";
import Manageunit from "../../editproduct/[id]/editproducts";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-100">
    
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <Manageunit />
      </div>
    </div>
  );
}

