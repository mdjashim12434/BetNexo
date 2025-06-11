
'use client';

import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard } from 'lucide-react';

export default function UserDashboardPage() {
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
              <LayoutDashboard className="mr-2 h-6 w-6 text-primary" /> Welcome, {user.name || user.email}!
            </CardTitle>
            <CardDescription>This is your personal dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Here you will find your account summary, recent activity, and quick links.</p>
            <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
                <h3 className="text-lg font-semibold text-foreground">User Dashboard Content</h3>
                <p className="text-sm text-muted-foreground">More features coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
