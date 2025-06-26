'use client';

import Link from 'next/link';
import { Flame, Radio, Ticket, History, Menu as MenuIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/', label: 'Popular', icon: Flame },
  { href: '/live', label: 'Live', icon: Radio },
  { href: '/bet-slip', label: 'Bet slip', icon: Ticket, isCenter: true },
  { href: '/bet-slip', label: 'History', icon: History },
  { href: '/profile', label: 'Menu', icon: MenuIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-transparent md:hidden">
      <div className="relative mx-auto grid h-16 max-w-full grid-cols-5 items-center border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 mt-4">
        {navItems.map((item) => {
          const isActive = (pathname === item.href && item.href !== '/') || (pathname === '/' && item.href === '/');
          
          if (item.isCenter) {
            return (
              <div key={item.label} className="flex justify-center">
                 <Link href={item.href} className="relative -top-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg ring-4 ring-background cursor-pointer">
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                    <span className="sr-only">{item.label}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center p-1 text-center space-y-1">
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] sm:text-xs leading-tight font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
