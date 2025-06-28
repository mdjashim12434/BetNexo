
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search } from 'lucide-react';

export default function Header() {
  const { user, balance, currency, logout, loadingAuth } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center">
          {loadingAuth ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : user && user.role !== 'Admin' ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/wallet" className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold text-foreground">{balance.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground -mt-1">{currency}</span>
                </div>
              </Link>
            </Button>
          ) : user && user.role === 'Admin' ? (
             <div className="w-24"/> // Placeholder for spacing
          ) : (
            <div className="w-24"/> // Placeholder for spacing
          )}
        </div>

        {/* Center Section */}
        <div className="flex-grow text-center">
          <Link href="/" className="text-4xl font-headline font-black italic tracking-tighter">
            <span className="text-white">BET</span><span className="text-primary">BABU</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end">
           {user ? (
             <Button variant="ghost" size="icon">
                <Search className="h-6 w-6 text-muted-foreground" />
             </Button>
           ) : (
             <div className="w-10" /> // Placeholder for spacing
           )}
        </div>
      </div>
    </header>
  );
}
