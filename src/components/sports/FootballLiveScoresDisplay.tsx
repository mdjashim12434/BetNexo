
'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchFootballLiveScores, fetchUpcomingFootballFixtures } from '@/services/sportmonksAPI';
import type { ProcessedFootballLiveScore, ProcessedFixture } from '@/types/sportmonks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Info, Goal, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

const REFRESH_INTERVAL_MS = 60000; // 60 seconds

export default function FootballLiveScoresDisplay() {
  const [liveMatches, setLiveMatches] = useState<ProcessedFootballLiveScore[]>([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState<ProcessedFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async (isManualRefresh: boolean = false) => {
    if (!isManualRefresh) {
        setLoading(true);
    }
    setError(null);

    try {
        const fetchedLiveMatches = await fetchFootballLiveScores();
        if (fetchedLiveMatches.length > 0) {
            setLiveMatches(fetchedLiveMatches);
            setUpcomingFixtures([]); // Clear upcoming if live are found
        } else {
            setLiveMatches([]); // Clear live matches
            const fetchedUpcoming = await fetchUpcomingFootballFixtures();
            
            // Filter for matches that have not started yet (State: Not Started or To Be Announced).
            // This prevents finished matches from today from showing up as "Upcoming".
            const trulyUpcoming = fetchedUpcoming.filter(match => 
                match.state?.state === 'NS' || match.state?.state === 'TBA'
            );

            // Sort the truly upcoming matches by starting time and take the top 5
            const sortedUpcoming = trulyUpcoming
                .sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime())
                .slice(0, 5);

            setUpcomingFixtures(sortedUpcoming);
        }

        if (isManualRefresh) {
            toast({ title: "Scores Updated", description: "Match data has been refreshed." });
        }
    } catch (err: any) {
        const errorMessage = err.message || 'An unknown error occurred while fetching matches.';
        setError(errorMessage);
        if (isManualRefresh) {
            toast({ title: "Refresh Failed", description: errorMessage, variant: "destructive", duration: 10000 });
        }
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData(); // Initial fetch
    const intervalId = setInterval(() => loadData(), REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [loadData]);

  const hasLiveMatches = liveMatches.length > 0;
  const hasUpcomingMatches = upcomingFixtures.length > 0;
  
  if (loading && !hasLiveMatches && !hasUpcomingMatches) {
    return (
      <div className="flex flex-col items-center justify-center py-10 my-4 text-muted-foreground bg-card rounded-lg shadow-lg min-h-[200px]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-lg">Loading Matches...</p>
      </div>
    );
  }

  return (
    <Card className="my-6 shadow-xl bg-card border border-border/60">
      <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-border/60">
        <div>
          <CardTitle className="font-headline text-xl md:text-2xl flex items-center text-primary">
            {hasLiveMatches ? (
              <><Goal className="mr-2 h-5 w-5 md:h-6 md:w-6 text-blue-500" /> Live Football Scores</>
            ) : (
              <><Calendar className="mr-2 h-5 w-5 md:h-6 md:w-6 text-blue-500" /> Upcoming Football</>
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

        {!hasLiveMatches && !hasUpcomingMatches && !loading && !error && (
          <div className="text-center py-10 text-muted-foreground min-h-[150px] flex flex-col items-center justify-center">
            <Info className="h-10 w-10 mb-3 text-primary/50" />
            <p className="font-semibold">No live or upcoming matches found at the moment.</p>
            <p className="text-sm">Please check back later.</p>
          </div>
        )}

        <div className="space-y-3">
          {hasLiveMatches && liveMatches.map((match) => (
            <Link key={`live-${match.id}`} href={`/match/${match.id}?sport=football`} legacyBehavior passHref>
              <a className="block p-3 sm:p-4 transition-all cursor-pointer bg-background border border-border/50 hover:border-primary/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-muted-foreground truncate">{match.leagueName}</p>
                    <div className="flex items-center gap-2">
                        {match.minute && <span className="text-xs font-semibold text-yellow-500">{match.minute}'</span>}
                        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                    </div>
                </div>
                <div className="flex justify-between items-center text-md font-semibold">
                    <span className="truncate pr-2">{match.homeTeam.name}</span>
                    <span className="font-bold text-primary">{match.homeTeam.score}</span>
                </div>
                <div className="flex justify-between items-center text-md font-semibold">
                    <span className="truncate pr-2">{match.awayTeam.name}</span>
                    <span className="font-bold text-primary">{match.awayTeam.score}</span>
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
             <Link key={`upcoming-${match.id}`} href={`/match/${match.id}?sport=football`} legacyBehavior passHref>
              <a className="block p-3 sm:p-4 transition-all cursor-pointer bg-background border border-border/50 hover:border-primary/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-muted-foreground truncate">{match.league.name}</p>
                    <Badge variant="secondary" className="text-blue-500 border-blue-500/30">
                        {new Date(match.startingAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {new Date(match.startingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
