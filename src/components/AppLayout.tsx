
'use client';

import type React from 'react';
import Header from '@/components/shared/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // All redirection logic is now handled centrally in AuthContext to prevent conflicts.
  return (
    <div className="flex min-h-screen flex-col">
      <Header /> 
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
