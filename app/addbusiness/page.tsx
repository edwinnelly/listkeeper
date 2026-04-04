'use client';
import AddBusinessPage from "./addbusiness";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col flex-1">
        <AddBusinessPage />
      </div>
    </div>
  );
}