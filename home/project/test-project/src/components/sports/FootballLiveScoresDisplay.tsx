
'use client';

import type { ProcessedFixture } from '@/types/sportmonks';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Info, Goal, Bell, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';

interface HomeMatchesDisplayProps {
  liveMatches: ProcessedFixture[];
  upcomingMatches: ProcessedFixture[];
  error?: string;
}

const LiveMatchCard = ({ match }: { match: ProcessedFixture }) => (
  <Link href={`/match/${match.id}`} passHref>
    <Card as="a" className="p-3 transition-all hover:bg-muted/50 cursor-pointer">
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Goal className="h-4 w-4 text-primary" />
          <span className="font-semibold truncate">{match.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <Star className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 w-2/5 truncate">
          <Image src={match.homeTeam.image_path || `https://placehold.co/40x40.png`} alt={match.homeTeam.name} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
          <span className="font-semibold text-sm truncate">{match.homeTeam.name}</span>
        </div>
        <div className="text-xl font-bold text-center">
          {match.homeScore} : {match.awayScore}
        </div>
        <div className="flex items-center gap-2 w-2/5 justify-end truncate">
          <span className="font-semibold text-sm text-right truncate">{match.awayTeam.name}</span>
          <Image src={match.awayTeam.image_path || `https://placehold.co/40x40.png`} alt={match.awayTeam.name} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
        </div>
      </div>
      
      {match.minute && <p className="text-center text-xs text-yellow-500 mb-3">{match.minute}' - {match.state.name}</p>}
    </Card>
  </Link>
);


const UpcomingMatchCard = ({ match }: { match: ProcessedFixture }) => (
  <Link href={`/match/${match.id}`} passHref>
    <Card as="a" className="p-3 transition-all hover:bg-muted/50 cursor-pointer">
       <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Goal className="h-4 w-4 text-primary" />
          <span className="font-semibold truncate">{match.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <Star className="h-4 w-4" />
        </div>
      </div>
      
       <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-col items-center gap-1 w-2/5 text-center">
          <Image src={match.homeTeam.image_path || `https://placehold.co/40x40.png`} alt={match.homeTeam.name} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
          <span className="font-semibold text-sm truncate">{match.homeTeam.name}</span>
        </div>
        <div className="text-xl font-bold text-muted-foreground">
          VS
        </div>
        <div className="flex flex-col items-center gap-1 w-2/5 text-center">
          <Image src={match.awayTeam.image_path || `https://placehold.co/40x40.png`} alt={match.awayTeam.name} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
          <span className="font-semibold text-sm text-right truncate">{match.awayTeam.name}</span>
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mb-3">{format(new Date(match.startingAt), "dd.MM.yy hh:mm a")}</p>
    </Card>
  </Link>
);

export default function HomeMatchesDisplay({
  liveMatches = [],
  upcomingMatches = [],
  error,
}: HomeMatchesDisplayProps) {

  const hasLiveMatches = liveMatches.length > 0;
  const hasUpcomingMatches = upcomingMatches.length > 0;

  return (
    <div className="space-y-6">
       {error && (
        <Card>
          <div className="p-4">
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        </Card>
      )}

      {hasLiveMatches && (
        <section>
          <div className="mb-2 flex justify-between items-center">
            <h2 className="font-headline text-xl font-bold text-foreground">Top LIVE <Button variant="ghost" size="sm" className="ml-1 text-primary">Sport</Button></h2>
            <Button variant="link" asChild><Link href="/sports/live">All</Link></Button>
          </div>
          <div className="space-y-3">
            {liveMatches.map((match) => <LiveMatchCard key={`live-${match.id}`} match={match} />)}
          </div>
        </section>
      )}
      
      {hasUpcomingMatches && (
         <section>
          <div className="mb-2 flex justify-between items-center">
            <h2 className="font-headline text-xl font-bold text-foreground">Top pre-match <Button variant="ghost" size="sm" className="ml-1 text-primary">Sport</Button></h2>
            <Button variant="link" asChild><Link href="/sports/upcoming">All</Link></Button>
          </div>
          <div className="space-y-3">
            {upcomingMatches.map((match) => <UpcomingMatchCard key={`upcoming-${match.id}`} match={match} />)}
          </div>
        </section>
      )}

      {!hasLiveMatches && !hasUpcomingMatches && !error && (
        <div className="text-center py-10 text-muted-foreground min-h-[200px] flex flex-col items-center justify-center">
          <Info className="h-10 w-10 mb-3 text-primary/50" />
          <p className="font-semibold">No live or upcoming matches found.</p>
          <p className="text-sm">Please check back later.</p>
        </div>
      )}
    </div>
  );
}
