'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function LivePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sports/live');
  }, [router]);
  
  return <AppLayout><div className="text-center p-10">Redirecting to Live matches...</div></AppLayout>;
}
