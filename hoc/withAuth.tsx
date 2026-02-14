'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/auth-provider';

export function withAuth(Component: any) {
  return function Protected(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/auth');
      }
    }, [loading, user, router]);

    if (loading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
          <div className="spinner" />
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

    if (!user) return null;

    return <Component {...props} user={user} />;
  };
}

