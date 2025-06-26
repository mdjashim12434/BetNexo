'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchLiveScores } from '@/services/sportmonksAPI';
import type { ProcessedLiveScore } from '@/types/sportmonks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Loader2, RefreshCw, Info } from 'lucide-react';
import { CricketIcon } from '@/components/icons/CricketIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const REFRESH_INTERVAL_MS = 60000; // 60 seconds for live scores

export default function LiveScoresDisplay() {
  const [matches, setMatches] = useState<ProcessedLiveScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadScores = useCallback(async (isManualRefresh: boolean = false) => {
    if (!isManualRefresh) {
      setLoading(true);
    }
    setError(null);
    try {
      const fetchedMatches = await fetchLiveScores();
      setMatches(fetchedMatches);
      if (isManualRefresh) {
        toast({ title: "Live Scores Updated", description: "Cricket live scores have been refreshed." });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred while fetching live scores.';
      setError(errorMessage);
      if (isManualRefresh) {
        toast({ title: "Refresh Failed", description: errorMessage, variant: "destructive", duration: 10000 });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadScores();
    const intervalId = setInterval(() => loadScores(), REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [loadScores]);

  if (loading && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 my-4 text-muted-foreground bg-card rounded-lg shadow-lg min-h-[200px]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-lg">Loading Live Cricket Scores...</p>
      </div>
    );
  }

  return (
    <Card className="my-6 shadow-xl bg-card border border-border/60">
      <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-border/60">
        <div>
          <CardTitle className="font-headline text-xl md:text-2xl flex items-center text-primary">
            <CricketIcon className="mr-2 h-5 w-5 md:h-6 md:w-6 text-green-500" />
            Live Cricket Scores
          </CardTitle>
        </div>
        <Button onClick={() => loadScores(true)} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={loading}>
          <RefreshCw className={cn("h-5 w-5", { "animate-spin": loading && matches.length > 0 })} />
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
            <p className="font-semibold">No live cricket matches found at the moment.</p>
            <p className="text-sm">Please check back later.</p>
          </div>
        )}
        <div className="space-y-3">
          {matches.map((match) => (
            <Card key={match.id} className="overflow-hidden bg-background border border-border/50 p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-muted-foreground truncate">{match.leagueName}</p>
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
              </div>
              <div className="space-y-1">
                 <div className="flex justify-between items-center text-md font-semibold">
                    <span className="truncate pr-2">{match.homeTeam.name}</span>
                    <span className="font-bold text-primary">{match.homeTeam.score}</span>
                </div>
                <div className="flex justify-between items-center text-md font-semibold">
                    <span className="truncate pr-2">{match.awayTeam.name}</span>
                    <span className="font-bold text-primary">{match.awayTeam.score}</span>
                </div>
                {match.note && <p className="text-xs text-center pt-2 text-accent font-medium">{match.note}</p>}
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
