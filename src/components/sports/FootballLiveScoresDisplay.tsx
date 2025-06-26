'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchFootballLiveScores } from '@/services/sportmonksAPI';
import type { ProcessedFootballLiveScore } from '@/types/sportmonks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Loader2, RefreshCw, Info, Goal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

const REFRESH_INTERVAL_MS = 15000; // 15 seconds

export default function FootballLiveScoresDisplay() {
  const [matches, setMatches] = useState<ProcessedFootballLiveScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadScores = useCallback(async (isManualRefresh: boolean = false) => {
    // For subsequent refreshes (manual or interval), we don't want the main loader, just the button spinner.
    // The main `loading` state is for the initial load only.
    if (!loading) {
        setLoading(true); // Trigger refresh spinner on subsequent loads
    }
    
    setError(null);
    try {
      const fetchedMatches = await fetchFootballLiveScores();
      setMatches(fetchedMatches);
      if (isManualRefresh) {
        toast({ title: "Live Scores Updated", description: "Football live scores have been refreshed." });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred while fetching football live scores.';
      setError(errorMessage);
      if (isManualRefresh) {
        toast({ title: "Refresh Failed", description: errorMessage, variant: "destructive", duration: 10000 });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, loading]);

  useEffect(() => {
    loadScores(); // Initial fetch
    const intervalId = setInterval(() => loadScores(), REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [loadScores]);

  if (loading && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 my-4 text-muted-foreground bg-card rounded-lg shadow-lg min-h-[200px]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-lg">Loading Live Football Scores...</p>
      </div>
    );
  }

  return (
    <Card className="my-6 shadow-xl bg-card border border-border/60">
      <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-border/60">
        <div>
          <CardTitle className="font-headline text-xl md:text-2xl flex items-center text-primary">
            <Goal className="mr-2 h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            Live Football Scores
          </CardTitle>
        </div>
         <Button onClick={() => loadScores(true)} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={loading}>
          <RefreshCw className={cn("h-5 w-5", { "animate-spin": loading })} />
          <span className="sr-only">Refresh Scores</span>
        </Button>
      </CardHeader>
      <CardContent className="pt-4 px-2 sm:px-4">
         {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {matches.length === 0 && !loading && !error && (
          <div className="text-center py-10 text-muted-foreground min-h-[150px] flex flex-col items-center justify-center">
            <Info className="h-10 w-10 mb-3 text-primary/50" />
            <p className="font-semibold">No live football matches found at the moment.</p>
            <p className="text-sm">Please check back later.</p>
          </div>
        )}
        <div className="space-y-3">
          {matches.map((match) => (
            <Link key={match.id} href={`/match/${match.id}?sport=football`} passHref>
                <Card className="overflow-hidden bg-background border border-border/50 p-3 sm:p-4 hover:border-primary/50 transition-all cursor-pointer">
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
                  <p className="text-xs text-center pt-2 text-accent font-medium flex items-center justify-center gap-1.5">
                    <Goal className="h-3 w-3" />
                    {match.latestEvent}
                  </p>
                )}
                </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
