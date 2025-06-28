
'use client';

import AppLayout from '@/components/AppLayout';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Star, Swords, Gamepad2, Dice5, Zap, Dribbble, Goal, CheckSquare, Tablet, Circle, Disc, Image as ImageIcon, CopyCheck, Basketball, TableTennisPaddleBall, TennisBall, Hockey } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import HomeMatchesDisplay from '@/components/sports/FootballLiveScoresDisplay';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ProcessedFixture } from '@/types/sportmonks';

// --- Top Navigation Data ---
const topNavItems = [
  { name: 'Top', href: '#', icon: Star },
  { name: 'Sports', href: '/sports/all-sports', icon: Swords },
  { name: 'Esports', href: '#', icon: Gamepad2 },
  { name: 'Casino', href: '/casino', icon: Dice5 },
  { name: 'Fast Games', href: '#', icon: Zap },
];

// --- Custom Icons for Sports Grid ---
const FootballIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-1.04 2.61l.98.56.98-.56l1.04 1.8l-1.04 1.8l-.98.56h-1.96l-.98-.56l-1.04-1.8l1.04-1.8zm2.08 6.78l1.04 1.8l-.98.56h-1.96l-.98-.56l1.04-1.8h1.84zm-6.24 0l1.04 1.8l-.98.56H5.96l-.98-.56l1.04-1.8h1.84zM12 17.39l-.98.56h-1.96l-.98-.56l-1.04-1.8l1.04-1.8l.98-.56h1.96l.98.56l1.04 1.8l-1.04 1.8zm2.08-3.39l.98.56h1.96l.98-.56l1.04-1.8l-1.04-1.8l-.98-.56h-1.96l-.98.56l-1.04 1.8l1.04 1.8h.02z"/>
    </svg>
);

const CricketIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g fill="currentColor" transform="rotate(45 12 12)">
            <path d="M13.5 3h-3L9 9v10h6V9l-1.5-6z"/>
        </g>
        <circle cx="6.5" cy="17.5" r="2.5" fill="currentColor"/>
    </svg>
);


// --- Sports Grid Data ---
const sportsGridItems = [
  { name: 'All', href: '/sports/all-sports', icon: CopyCheck },
  { name: 'Cricket', href: '#', icon: CricketIcon },
  { name: 'Football', href: '/sports/football', icon: FootballIcon },
  { name: 'Basketball', href: '#', icon: Basketball },
  { name: 'Table Tennis', href: '#', icon: TableTennisPaddleBall },
  { name: 'Tennis', href: '#', icon: TennisBall },
  { name: 'Ice Hockey', href: '#', icon: Hockey },
];

// --- Promotional Banners Data ---
const promoBanners = [
  { title: "WINtality Blast", imageHint: "cricket player celebrating", href: "#" },
  { title: "Grand Slam - Grand Win", imageHint: "tennis players action", href: "#" },
  { title: "Sure Bet", imageHint: "cricket ball fire", href: "#" },
  { title: "Deposit Bonus", imageHint: "money coins gold", href: "/deposit" },
];

// --- Casino Quick Links Data ---
const casinoLinks = [
  { name: "All Games", imageHint: "dice pattern", href: "/casino" },
  { name: "Western slot", imageHint: "cowboy slot machine", href: "/casino" },
  { name: "21", imageHint: "blackjack cards", href: "/casino" },
  { name: "Under and Over 7", imageHint: "dice seven", href: "/casino" },
  { name: "Midgard Zombies", imageHint: "zombie cartoon", href: "/casino" },
];

interface HomeClientPageProps {
  initialLiveMatches: ProcessedFixture[];
  initialUpcomingMatches: ProcessedFixture[];
  initialError: string | null;
}

export default function HomeClientPage({
  initialLiveMatches,
  initialUpcomingMatches,
  initialError,
}: HomeClientPageProps) {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.32))]">
          <div className="text-center p-10">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="space-y-4 md:space-y-6 pb-24">
          
          {/* Top Navigation */}
          <ScrollArea className="w-full whitespace-nowrap -mt-4">
            <div className="flex justify-between items-center p-2 gap-4">
              {topNavItems.map((item, index) => (
                <Link href={item.href} key={item.name} className={cn("flex flex-col items-center justify-center gap-1.5 pb-2 text-muted-foreground hover:text-primary transition-colors", index === 0 ? "text-primary border-b-2 border-primary" : "")}>
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium tracking-tight">{item.name}</span>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden"/>
          </ScrollArea>
          
          {/* Sports Grid */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 px-1 py-1">
              {sportsGridItems.map(sport => (
                <Link href={sport.href} key={sport.name} className="flex flex-col items-center justify-center w-20 h-20 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow gap-2 p-2">
                    <sport.icon className="h-8 w-8 text-primary" />
                    <span className="text-xs font-medium text-foreground truncate">{sport.name}</span>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden"/>
          </ScrollArea>

          {/* Promotional Banners */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 px-1 py-1">
                {promoBanners.map(banner => (
                  <Link href={banner.href} key={banner.title} legacyBehavior passHref>
                    <a className="block">
                      <Card className="w-64 h-32 overflow-hidden relative group">
                        <Image 
                          src={`https://placehold.co/400x200.png`} 
                          alt={banner.title} 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          data-ai-hint={banner.imageHint}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <CardContent className="absolute bottom-0 left-0 p-3">
                          <h3 className="text-white font-bold text-sm">{banner.title}</h3>
                        </CardContent>
                      </Card>
                    </a>
                  </Link>
                ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden"/>
          </ScrollArea>

          {/* Casino Quick Links */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 px-1 py-1">
              {casinoLinks.map(link => (
                  <Link href={link.href} key={link.name} className="flex flex-col items-center justify-center gap-2 w-20 text-center">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                          <AvatarImage src={`https://placehold.co/128x128.png`} data-ai-hint={link.imageHint}/>
                          <AvatarFallback><ImageIcon /></AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-muted-foreground truncate w-full">{link.name}</span>
                  </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden"/>
          </ScrollArea>
          
          {/* Live & Upcoming Matches Section */}
          <HomeMatchesDisplay 
            liveMatches={initialLiveMatches}
            upcomingMatches={initialUpcomingMatches}
            error={initialError || undefined}
          />

        </div>
      </div>
      <BottomNav />
    </AppLayout>
  );
}
