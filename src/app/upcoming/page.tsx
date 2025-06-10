'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function UpcomingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sports/upcoming');
  }, [router]);
  
  return <AppLayout><div className="text-center p-10">Redirecting to Upcoming matches...</div></AppLayout>;
}
