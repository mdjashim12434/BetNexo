
'use client';

import type React from 'react';
import Header from '@/components/shared/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loadingAuth } = useAuth(); // Removed balance and currency as Header now gets them
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loadingAuth) {
      return;
    }

    if (user && user.role === 'Admin') {
      if (!pathname.startsWith('/admin') && pathname !== '/login' && pathname !== '/signup') {
        console.log(`AppLayout: Admin user (role: ${user.role}) detected on non-admin page (${pathname}). Redirecting to /admin.`);
        router.push('/admin');
      }
    }
  }, [user, loadingAuth, pathname, router]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Removed props from Header as it now uses useAuth directly */}
      <Header /> 
      <main className="flex-grow container py-6">
        {children}
      </main>
    </div>
  );
}
