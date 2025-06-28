
'use client';

import AppLayout from '@/components/AppLayout';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Star, Swords, Gamepad2, Dice5, Zap, Goal, Image as ImageIcon, CopyCheck, Disc } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LiveFixtures from '@/components/LiveFixtures';
import UpcomingFixtures from '@/components/UpcomingFixtures';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// --- Top Navigation Data ---
const topNavItems = [
  { name: 'Top', href: '#', icon: Star },
  { name: 'Sports', href: '/sports/all-sports', icon: Swords },
  { name: 'Esports', href: '#', icon: Gamepad2 },
  { name: 'Casino', href: '/casino', icon: Dice5 },
  { name: 'Fast Games', href: '#', icon: Zap },
];

// --- Sports Grid Data (Using reliable lucide-react icons) ---
const sportsGridItems = [
  { name: 'All', href: '/sports/all-sports', icon: CopyCheck },
  { name: 'Cricket', href: '#', icon: Disc },
  { name: 'Football', href: '/sports/football', icon: Goal },
  { name: 'Basketball', href: '#', icon: Star },
  { name: 'Table Tennis', href: '#', icon: Zap },
  { name: 'Tennis', href: '#', icon: Zap },
  { name: 'Ice Hockey', href: '#', icon: Swords },
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

export default function HomeClientPage() {
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
          <div className="space-y-6">
            <LiveFixtures />
            <UpcomingFixtures />
          </div>

        </div>
      </div>
      <BottomNav />
    </AppLayout>
  );
}
