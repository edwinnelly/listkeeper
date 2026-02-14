'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import Sidebar from './component/sidebar';
import Header from './component/headers';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './providers/auth-provider';

NProgress.configure({
  showSpinner: false,
  speed: 300,
  minimum: 0.1,
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- NProgress on route change
  useEffect(() => {
    NProgress.start();
    NProgress.done();
  }, [pathname]);

  const excludedRoutes = ['/auth', '/logout', '/register','/landing'];
  const hideLayout = excludedRoutes.includes(pathname);

  if (hideLayout) return <>{children}</>; // show auth pages without layout

  return (
    <AuthProvider>
      <div className="flex h-full">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-col flex-1">
          <Header setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto p-3">{children}</main>
        </div>
      </div>

      <Toaster position="top-right" />
    </AuthProvider>
  );
}
