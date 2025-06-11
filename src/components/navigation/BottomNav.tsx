
'use client';

import Link from 'next/link';
import { Flame, Dice5, Ticket, WalletCards, Menu as MenuIcon } from 'lucide-react'; // Changed Home to Flame, added Ticket and MenuIcon
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Sports', icon: Flame }, // Changed from Home to Sports with Flame icon
  { href: '/casino', label: 'Casino', icon: Dice5 },
  { href: '/bet-slip', label: 'Bet Slip', icon: Ticket }, // New Bet Slip item
  { href: '/deposit', label: 'Deposit', icon: WalletCards },
  { href: '/profile', label: 'Menu', icon: MenuIcon }, // Changed Withdraw to Menu, linking to profile
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="mx-auto grid h-16 max-w-full grid-cols-5 items-center px-1"> {/* Adjusted for 5 items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/' && pathname.startsWith('/sports'));
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center p-1 text-center">
              <item.icon className={cn("h-5 w-5 sm:h-6 sm:w-6 mb-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] sm:text-xs leading-tight", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
