
'use client';

import type React from 'react';
import Header from '@/components/shared/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useEffect } from 'react'; // Added useEffect

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, balance, currency, loadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until authentication status is resolved
    if (loadingAuth) {
      return;
    }

    if (user && user.role === 'Admin') {
      // If user is Admin, restrict them to admin panel or auth pages
      if (!pathname.startsWith('/admin') && pathname !== '/login' && pathname !== '/signup') {
        console.log(`AppLayout: Admin user (role: ${user.role}) detected on non-admin page (${pathname}). Redirecting to /admin.`);
        router.push('/admin');
      }
    }
    // Non-admin users are allowed on non-admin pages.
    // Protected routes logic (e.g., redirecting to /login if !user) is typically handled by individual pages.
  }, [user, loadingAuth, pathname, router]);

  // The useEffect above handles redirection.
  // Child pages are expected to handle their own loading/redirect states
  // if they depend on the user being authenticated but not an admin.
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} balance={balance} currency={currency} />
      <main className="flex-grow container py-6">
        {children}
      </main>
    </div>
  );
}

