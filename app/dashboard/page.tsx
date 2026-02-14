'use client';

import { useState } from 'react';
import { withAuth } from '@/hoc/withAuth';
import Dashboard from '../component/dashboard';
import NewAccount from '../component/newAccount';
import dayjs from 'dayjs';

interface Business {
  id: number;
  business_key: string;
  business_name: string;
  subscription_type: string;
  about_business: string | null;
  address?: string | null;
  logo?: string | null;
  phone?: string | null;
  created_at?: string | null;
}

interface User {
  id: number;
  name: string;
  creator: 'Host' | 'Manager' | 'Staff';
  active_business_key: string;
  business_key: string;
  businesses_one?: Business[];
  about_business: string;
}

function DashboardPage({ user, loading }: { user: User | null; loading: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  //HARD GUARD — prevent crash if user is null
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="spinner"></div>
        <style jsx>{`
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top-color: #0077c8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  const firstBusiness = user.businesses_one?.[0];
  const createdAt = firstBusiness?.created_at
    ? dayjs(firstBusiness.created_at).format('MMMM D, YYYY')
    : undefined;

  if (user.creator === 'Host' && user.active_business_key === '0') {
    return <NewAccount />;
  }

  return (
    <div className="flex flex-col flex-1">
      <Dashboard
        user={user}
        logo={firstBusiness?.logo}
        business_name={firstBusiness?.business_name}
        about_business={firstBusiness?.about_business}
        address={firstBusiness?.address}
        phone={firstBusiness?.phone}
        subscription_type={firstBusiness?.subscription_type}
        created_at={createdAt}
      />
    </div>
  );
}

export default withAuth(DashboardPage);
