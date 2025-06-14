
'use client';

import AppLayout from '@/components/AppLayout';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Flame, ListChecks, CalendarClock, LucideIcon } from 'lucide-react';
import { CricketIcon } from '@/components/icons/CricketIcon';
import { Goal } from 'lucide-react'; 
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
// import MatchCard, { type Match } from '@/components/sports/MatchCard'; // MatchCard no longer used here
import LiveOddsDisplay from '@/components/sports/LiveOddsDisplay';

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

        {/* Removed Mock Live Matches and Featured Football sections that used MatchCard with mock data */}
        {/* These sections can be re-implemented later with API-driven content if desired */}

        <section>
          {/* Live Odds Display Section for Cricket */}
          {/* You can find sport_key values at https://the-odds-api.com/sports-odds-data/sports-apis.html */}
          <LiveOddsDisplay 
            sportKey="cricket_international_t20" 
            sportDisplayName="International T20 Cricket" 
            region="uk" 
            maxItems={3} 
          />
        </section>

        <section>
           {/* Live Odds Display Section for Football (e.g., EPL) */}
           <LiveOddsDisplay 
            sportKey="soccer_epl" 
            sportDisplayName="English Premier League Football" 
            region="uk" 
            maxItems={3} 
          />
        </section>
        
      </div>
      <BottomNav />
    </AppLayout>
  );
}
