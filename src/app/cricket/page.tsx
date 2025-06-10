'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function CricketPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sports/cricket');
  }, [router]);
  
  return <AppLayout><div className="text-center p-10">Redirecting to Cricket matches...</div></AppLayout>;
}
