'use client';

import type { ProcessedFixture } from '@/types/sportmonks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info, Goal, Calendar, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { CricketIcon } from '../icons/CricketIcon';

interface HomeMatchesDisplayProps {
  matches?: ProcessedFixture[];
  error?: string;
}

export default function HomeMatchesDisplay({
  matches = [],
  error,
}: HomeMatchesDisplayProps) {

  const liveMatches = matches.filter(m => m.isLive);
  const upcomingFixtures = matches.filter(m => !m.isLive && !m.isFinished);

  const hasLiveMatches = liveMatches.length > 0;
  const hasUpcomingMatches = upcomingFixtures.length > 0;
  
  const sportIcon = (sportKey: 'football' | 'cricket') => {
      if (sportKey === 'football') {
          return <Goal className="mr-2 h-5 w-5 md:h-6 md:w-6 text-blue-500" />;
      }
      return <CricketIcon className="mr-2 h-5 w-5 md:h-6 md:w-6 text-red-500" />;
  }

  return (
    <Card className="my-6 shadow-xl bg-card border border-border/60">
      <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-border/60">
        <div>
          <CardTitle className="font-headline text-xl md:text-2xl flex items-center text-primary">
            {hasLiveMatches ? (
              <><Flame className="mr-2 h-5 w-5 md:h-6 md:w-6 text-red-500" /> Live Matches</>
            ) : (
              <><Calendar className="mr-2 h-5 w-5 md:h-6 md:w-6 text-blue-500" /> Upcoming Matches</>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-2 sm:px-4">
         {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!hasLiveMatches && !hasUpcomingMatches && !error && (
          <div className="text-center py-10 text-muted-foreground min-h-[150px] flex flex-col items-center justify-center">
            <Info className="h-10 w-10 mb-3 text-primary/50" />
            <p className="font-semibold">No live or upcoming matches found.</p>
            <p className="text-sm">Please check back later.</p>
          </div>
        )}

        <div className="space-y-3">
          {hasLiveMatches && liveMatches.map((match) => (
            <Link key={`live-${match.id}`} href={`/match/${match.id}?sport=${match.sportKey}`} legacyBehavior passHref>
              <a className="block p-3 sm:p-4 transition-all cursor-pointer bg-background border border-border/50 hover:border-primary/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        {sportIcon(match.sportKey)} {match.league.name}
                    </p>
                    <div className="flex items-center gap-2">
                        {match.minute && <span className="text-xs font-semibold text-yellow-500">{match.minute}'</span>}
                        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                    </div>
                </div>
                <div className="flex justify-between items-center text-md font-semibold">
                    <span className="truncate pr-2">{match.homeTeam.name}</span>
                    <span className="font-bold text-primary text-sm">{match.homeScore}</span>
                </div>
                <div className="flex justify-between items-center text-md font-semibold">
                    <span className="truncate pr-2">{match.awayTeam.name}</span>
                    <span className="font-bold text-primary text-sm">{match.awayScore}</span>
                </div>
                {match.latestEvent && (
                  <p className="text-xs text-center pt-2 text-accent-foreground font-medium flex items-center justify-center gap-1.5">
                    <Goal className="h-3 w-3" />
                    {match.latestEvent}
                  </p>
                )}
              </a>
            </Link>
          ))}

          {hasUpcomingMatches && upcomingFixtures.map((match) => (
             <Link key={`upcoming-${match.id}`} href={`/match/${match.id}?sport=${match.sportKey}`} legacyBehavior passHref>
              <a className="block p-3 sm:p-4 transition-all cursor-pointer bg-background border border-border/50 hover:border-primary/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        {sportIcon(match.sportKey)} {match.league.name}
                    </p>
                    <Badge variant="secondary" className="text-blue-500 border-blue-500/30">
                        {format(new Date(match.startingAt), 'MMM d, h:mm a')}
                    </Badge>
                </div>
                <div className="flex items-center text-md font-semibold">
                    <span className="truncate">{match.homeTeam.name}</span>
                </div>
                <div className="flex items-center text-md font-semibold mt-1">
                    <span className="truncate">{match.awayTeam.name}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
