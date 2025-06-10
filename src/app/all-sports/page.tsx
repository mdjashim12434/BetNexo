'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function AllSportsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sports/all-sports');
  }, [router]);
  
  return <AppLayout><div className="text-center p-10">Redirecting to All Sports...</div></AppLayout>;
}
