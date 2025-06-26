
'use client';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function WalletPage() {
  const { user, balance, currency, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.32))]">
          <div className="text-center p-10">Loading wallet...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <Wallet className="mr-3 h-7 w-7 text-primary" /> My Wallet
            </CardTitle>
            <CardDescription>Manage your funds and view your balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-lg bg-muted text-center">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-4xl font-bold text-primary">
                {currency} {balance.toFixed(2)}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild size="lg" className="h-auto py-4">
                <Link href="/deposit" className="flex flex-col items-center">
                  <ArrowUpCircle className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Deposit</span>
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-auto py-4">
                <Link href="/withdraw" className="flex flex-col items-center">
                  <ArrowDownCircle className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Withdraw</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
