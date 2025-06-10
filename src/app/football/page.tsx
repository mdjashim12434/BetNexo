'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function FootballPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sports/football');
  }, [router]);
  
  return <AppLayout><div className="text-center p-10">Redirecting to Football matches...</div></AppLayout>;
}
