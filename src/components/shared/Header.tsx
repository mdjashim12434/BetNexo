
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/contexts/AuthContext';

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
        <div className="flex items-center space-x-3">
          {user && (
            <Link href="/profile" className="flex items-center space-x-3">
              {/* Balance display, now always visible if user is logged in */}
              <div className="flex items-center justify-center rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                <span>{balance.toFixed(2)} {currency}</span>
              </div>
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`} alt={user.name || 'User'} data-ai-hint="user avatar" />
                <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </Link>
          )}
          {!user && (
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
