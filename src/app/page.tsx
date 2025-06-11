
'use client';

import AppLayout from '@/components/AppLayout';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowRight, Flame, ListChecks, CalendarClock, LucideIcon } from 'lucide-react';
import { CricketIcon } from '@/components/icons/CricketIcon';
import { Goal } from 'lucide-react'; 
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MatchCard, { type Match } from '@/components/sports/MatchCard';

interface SportCategoryButton {
  name: string;
  href: string;
  icon: LucideIcon | React.ElementType; 
  borderColorClass?: string;
}

const sportCategoryButtons: SportCategoryButton[] = [
  { name: 'Live', href: '/sports/live', icon: Flame, borderColorClass: 'hover:border-red-500' },
  { name: 'Cricket', href: '/sports/cricket', icon: CricketIcon, borderColorClass: 'hover:border-green-500' },
  { name: 'Football', href: '/sports/football', icon: Goal, borderColorClass: 'hover:border-blue-500' },
  { name: 'Upcoming', href: '/sports/upcoming', icon: CalendarClock, borderColorClass: 'hover:border-yellow-500' },
  { name: 'All Sports', href: '/sports/all-sports', icon: ListChecks, borderColorClass: 'hover:border-gray-500' },
];

const mockLiveMatches: Match[] = [
  { id: 'live1', teamA: 'Team Alpha', teamB: 'Team Beta', time: 'LIVE', sport: 'Football', league: 'Premier League', oddsA: '1.90', oddsDraw: '3.60', oddsB: '3.80', status: 'live', imageUrl: 'https://placehold.co/600x300.png?text=Live+Football1', imageAiHint: 'live football' },
  { id: 'live2', teamA: 'India', teamB: 'Australia', time: 'LIVE', sport: 'Cricket', league: 'Test Series', oddsA: '2.00', oddsB: '2.50', status: 'live', imageUrl: 'https://placehold.co/600x300.png?text=Live+Cricket1', imageAiHint: 'live cricket' },
];

const mockFeaturedFootballMatches: Match[] = [
   { id: 'ff1', teamA: 'Real Madrid', teamB: 'Barcelona', time: 'Tomorrow 19:00 GMT', sport: 'Football', league: 'La Liga', oddsA: '2.20', oddsDraw: '3.20', oddsB: '3.00', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=El+Clasico', imageAiHint: 'football clasico' },
   { id: 'ff2', teamA: 'Man United', teamB: 'Arsenal', time: 'Sun 15:30 GMT', sport: 'Football', league: 'Premier League', oddsA: '2.50', oddsDraw: '3.40', oddsB: '2.70', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=EPL+Derby', imageAiHint: 'football derby' },
];


export default function HomePage() {
  const { user, loadingAuth } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading session...</div></div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login...</div></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-16">
        
        {/* Removed redundant balance display for small screens, as Header now handles it */}

        <section>
          <ScrollArea className="w-full whitespace-nowrap rounded-md pb-2.5">
            <div className="flex space-x-3 p-1">
              {sportCategoryButtons.map((category) => (
                <Link href={category.href} key={category.name} legacyBehavior>
                  <a className={`flex flex-col items-center justify-center p-3 border-2 border-transparent rounded-lg bg-card hover:shadow-md transition-all w-24 h-24 text-center ${category.borderColorClass}`}>
                    <category.icon className="h-7 w-7 mb-1.5 text-primary" />
                    <span className="text-xs font-medium text-foreground truncate">{category.name}</span>
                  </a>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
        
        <Link href="/casino">
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-primary-foreground shadow-xl hover:opacity-90 transition-opacity cursor-pointer">
            <CardContent className="p-6 text-center">
              <h2 className="font-headline text-2xl font-bold">Visit Our Casino!</h2>
              <p className="mt-1 text-sm">Spin the reels and win big prizes!</p>
              <Button variant="secondary" className="mt-3 bg-background/20 hover:bg-background/30">Play Now</Button>
            </CardContent>
          </Card>
        </Link>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline text-xl font-semibold text-primary flex items-center">
              <Flame className="mr-2 h-5 w-5 text-red-500" /> Top Live Matches
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sports/live">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {mockLiveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockLiveMatches.slice(0, 2).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No live matches currently.</p>
          )}
        </section>

        <section>
           <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline text-xl font-semibold text-primary flex items-center">
              <Goal className="mr-2 h-5 w-5 text-blue-500" /> Featured Football
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sports/football">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {mockFeaturedFootballMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockFeaturedFootballMatches.slice(0, 2).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
             <p className="text-muted-foreground text-sm">No featured football matches.</p>
          )}
        </section>
        
      </div>
      <BottomNav />
    </AppLayout>
  );
}
