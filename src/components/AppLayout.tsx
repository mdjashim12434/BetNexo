'use client';

import type React from 'react';
import Header from '@/components/shared/Header';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, balance, currency } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} balance={balance} currency={currency} />
      <main className="flex-grow container py-6">
        {children}
      </main>
    </div>
  );
}
