import Link from 'next/link';
import { RadioTower, Dice5, Goal, CalendarClock, ListChecks, Home } from 'lucide-react';
import { CricketIcon } from '@/components/icons/CricketIcon'; // Assuming you create this
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/live', label: 'Live', icon: RadioTower },
  { href: '/casino', label: 'Casino', icon: Dice5 },
  { href: '/cricket', label: 'Cricket', icon: CricketIcon },
  { href: '/football', label: 'Football', icon: Goal },
  { href: '/upcoming', label: 'Upcoming', icon: CalendarClock },
  { href: '/all-sports', label: 'All Sports', icon: ListChecks },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center"> {/* Show 4 most important items, or make scrollable */}
        {navItems.slice(0,4).map((item) => { // Example: showing first 4 items; adjust as needed
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center p-2">
              <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
