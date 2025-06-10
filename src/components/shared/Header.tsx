import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins, UserCircle2 } from 'lucide-react';
import type { User } from '@/contexts/AuthContext'; // Assuming User type definition

interface HeaderProps {
  user?: User | null;
  balance?: number;
  currency?: string;
}

export default function Header({ user, balance = 0, currency = "USD" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-headline font-bold text-primary">
          BETBABU
        </Link>
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Coins className="h-5 w-5 text-accent" />
              <span>{balance.toFixed(2)} {currency}</span>
            </div>
          )}
          {user ? (
            <Link href="/profile">
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`} alt={user.name || 'User'} data-ai-hint="user avatar" />
                <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </Link>
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
