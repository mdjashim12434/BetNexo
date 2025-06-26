
'use client';

import AppLayout from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Mail, User as UserIcon, Calendar, ShieldCheck, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, logout, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return 'Not available';
    }
    try {
      // Convert Firestore Timestamp to JS Date and format it
      return format(timestamp.toDate(), 'MMMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  if (loadingAuth || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.32))]">
          <div className="text-center p-10">Loading profile...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="shadow-xl">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`} alt={user.name || 'User'} data-ai-hint="user avatar" />
                <AvatarFallback className="text-4xl">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div className="pt-4">
                <CardTitle className="font-headline text-3xl">{user.name || 'User Profile'}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 mt-1">
                  <ShieldCheck className={`h-4 w-4 ${user.emailVerified ? 'text-green-500' : 'text-yellow-500'}`} />
                  {user.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />
              <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center"><Hash className="h-5 w-5 mr-3 text-primary" /> User ID</span>
                      <span className="font-mono text-foreground">{user.customUserId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center"><Mail className="h-5 w-5 mr-3 text-primary" /> Email</span>
                      <span className="font-medium text-foreground">{user.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center"><Calendar className="h-5 w-5 mr-3 text-primary" /> Joined On</span>
                      <span className="font-medium text-foreground">{formatDate(user.createdAt)}</span>
                  </div>
              </div>
              <Separator />
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
