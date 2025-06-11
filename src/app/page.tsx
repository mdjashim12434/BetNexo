
'use client';

import AppLayout from '@/components/AppLayout';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Dice5, Goal, ListChecks, RadioTower, CalendarClock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CricketIcon } from '@/components/icons/CricketIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface SportCategory {
  name: string;
  icon: React.ElementType;
  href: string;
  bgColorClass: string;
  textColorClass: string;
  description: string;
  sampleMatches?: { teamA: string; teamB: string; time: string }[];
}

const categories: SportCategory[] = [
  { name: 'Live', href: '/live', icon: RadioTower, bgColorClass: 'bg-red-500/10', textColorClass: 'text-red-400', description: 'Ongoing matches now!', sampleMatches: [{teamA: 'Team X', teamB: 'Team Y', time: 'LIVE'}] },
  { name: 'Casino', href: '/casino', icon: Dice5, bgColorClass: 'bg-purple-500/10', textColorClass: 'text-purple-400', description: 'Spin and win big!' },
  { name: 'Cricket', href: '/cricket', icon: CricketIcon, bgColorClass: 'bg-green-500/10', textColorClass: 'text-green-400', description: 'Catch the wicket action.' },
  { name: 'Football', href: '/football', icon: Goal, bgColorClass: 'bg-blue-500/10', textColorClass: 'text-blue-400', description: 'Goals, goals, goals!' },
  { name: 'Upcoming', href: '/upcoming', icon: CalendarClock, bgColorClass: 'bg-yellow-500/10', textColorClass: 'text-yellow-400', description: 'Games starting soon.' },
  { name: 'All Sports', href: '/all-sports', icon: ListChecks, bgColorClass: 'bg-gray-500/10', textColorClass: 'text-gray-400', description: 'Explore all categories.' },
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
     // This state should ideally be brief as the useEffect above will redirect.
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login...</div></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-16"> {/* Add padding-bottom for BottomNav */}
        {/* Hero Section - Optional */}
        <Card className="bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground shadow-xl">
          <CardContent className="p-6">
            <h1 className="font-headline text-3xl font-bold">Welcome to BETBABU, {user.name || 'Player'}!</h1>
            <p className="mt-2 text-lg">Your ultimate destination for sports and casino action.</p>
            <Button className="mt-4 bg-background text-foreground hover:bg-background/90" asChild>
              <Link href="/all-sports">Explore Games</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Categories Section */}
        <section>
          <h2 className="mb-6 font-headline text-2xl font-semibold">Categories</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link href={category.href} key={category.name}>
                <Card className={`hover:shadow-lg transition-shadow duration-300 ${category.bgColorClass} border-border hover:border-primary`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-lg font-medium font-headline ${category.textColorClass}`}>
                      {category.name}
                    </CardTitle>
                    <category.icon className={`h-6 w-6 ${category.textColorClass}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    {category.sampleMatches && category.sampleMatches.map(match => (
                       <p key={match.teamA} className="text-xs text-foreground/70 mt-1">{match.teamA} vs {match.teamB} - {match.time}</p>
                    ))}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Matches Section - Placeholder */}
        <section>
          <h2 className="mb-6 font-headline text-2xl font-semibold">Featured Matches</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Cricket: Team A vs Team B</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Image src="https://placehold.co/600x300.png" alt="Match placeholder" width={600} height={300} className="rounded-md" data-ai-hint="stadium sport" />
                  <p className="text-sm text-muted-foreground">Live Now - Catch the action!</p>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">1: 2.50</Button>
                      <Button variant="outline" size="sm">X: 3.00</Button>
                      <Button variant="outline" size="sm">2: 2.80</Button>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/match/1">Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </AppLayout>
  );
}
