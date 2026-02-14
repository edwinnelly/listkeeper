'use client';
// import { useState, useEffect } from "react";
import AddBusinessPage from "./addbusiness";

export default function DashboardPage({ user, loading }: { user: any; loading: boolean }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col flex-1">
        <AddBusinessPage />
      </div>
    </div>
  );
}