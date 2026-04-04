'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from './auth';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      router.push('/login');
    };
    
    performLogout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Logging out...</h1>
        <p className="mt-2 text-gray-600">Please wait</p>
      </div>
    </div>
  );
}