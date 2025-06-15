
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LogOut as LogOutIcon } from 'lucide-react';

export default function Header() {
  const { user, balance, currency, logout, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-headline font-bold text-primary">
          BETBABU
        </Link>
        <div className="flex items-center space-x-3">
          {loadingAuth ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : user ? (
            user.role === 'Admin' ? (
              <>
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Admin Panel</span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-foreground hover:text-accent-foreground hover:bg-accent">
                  <LogOutIcon className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Link href="/profile" className="flex items-center space-x-3">
                <div className="flex items-center justify-center rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                  <span>{balance.toFixed(2)} {currency}</span>
                </div>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`} alt={user.name || 'User'} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
              </Link>
            )
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
