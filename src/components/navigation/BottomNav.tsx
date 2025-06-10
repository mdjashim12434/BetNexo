import Link from 'next/link';
import { Home, RadioTower, Dice5, WalletCards, ArrowUpFromLine } from 'lucide-react';
import { CricketIcon } from '@/components/icons/CricketIcon';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/live', label: 'Live', icon: RadioTower },
  { href: '/casino', label: 'Casino', icon: Dice5 },
  { href: '/cricket', label: 'Cricket', icon: CricketIcon },
  { href: '/deposit', label: 'Deposit', icon: WalletCards },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="mx-auto grid h-16 max-w-full grid-cols-6 items-center px-1"> {/* Adjusted for 6 items and full width with slight padding */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center p-1 text-center">
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
