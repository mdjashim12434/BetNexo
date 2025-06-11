
'use client';

import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BetSlipPage() {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading session...</div></div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login...</div></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <Ticket className="mr-2 h-6 w-6 text-primary" /> Your Bet Slip
            </CardTitle>
            <CardDescription>Review your selected bets before placing them.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8">
              <Ticket className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Your bet slip is currently empty.</p>
              <p className="text-muted-foreground text-center text-sm">Add selections from matches to see them here.</p>
            </div>
            {/* Future: List of selected bets and total stake/winnings */}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
