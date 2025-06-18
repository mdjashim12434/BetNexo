
'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchSportsOdds, type SimplifiedMatchOdds } from '@/services/oddsAPI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertTriangle, BarChartHorizontalBig, CalendarClock, Loader2, RefreshCw, Info, ArrowDownUp } from 'lucide-react';
import { format, formatDistanceToNowStrict, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

interface LiveOddsDisplayProps {
  sportKey: string;
  sportDisplayName: string;
  region?: string;
  markets?: string;
  maxItems?: number;
}

const REFRESH_INTERVAL_MS = 30000; // 30 seconds

const formatMatchTime = (timeString?: string): string => {
  if (!timeString) return 'N/A';
  const date = new Date(timeString);
  if (isValid(date)) {
    return format(date, 'MMM d, h:mm a');
  }
  // If date is invalid, return a fallback string
  return 'N/A'; 
};

export default function LiveOddsDisplay({
  sportKey,
  sportDisplayName,
  region = 'uk',
  markets = 'h2h,totals',
  maxItems = 3
}: LiveOddsDisplayProps) {
  const [matches, setMatches] = useState<SimplifiedMatchOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadOdds = useCallback(async (isManualRefresh: boolean = false) => {
    if (!isManualRefresh) {
        setLoading(true);
    }
    setError(null);
    try {
      const fetchedMatches = await fetchSportsOdds(sportKey, region, markets);
      setMatches(fetchedMatches.slice(0, maxItems));
      setLastUpdated(new Date());
      if (isManualRefresh) {
        toast({ title: "Odds Updated", description: `${sportDisplayName} odds have been refreshed.` });
      }
    } catch (err: any) {
      console.error(`Error in LiveOddsDisplay for ${sportKey}:`, err);
      let detailedErrorMessage = err.message || 'An unknown error occurred while fetching odds.';
      let displayMessage = `Failed to load odds for ${sportDisplayName}. Backend reported: "${detailedErrorMessage}"`;

      if (detailedErrorMessage.toLowerCase().includes('api key') || detailedErrorMessage.toLowerCase().includes('unauthorized') || detailedErrorMessage.toLowerCase().includes('forbidden') || detailedErrorMessage.toLowerCase().includes('api_key')) {
        displayMessage += " This often indicates an issue with the API key (it might be invalid, expired, or have quota problems) or The Odds API service itself.";
      } else if (detailedErrorMessage.toLowerCase().includes('quota')) {
         displayMessage += " The API request quota might have been exceeded.";
      } else if (detailedErrorMessage.toLowerCase().includes('network') || detailedErrorMessage.toLowerCase().includes('fetch')) {
        displayMessage += " There might be a network issue connecting to the odds service.";
      }

      setError(displayMessage);
      if (isManualRefresh) {
        toast({ title: "Refresh Failed", description: displayMessage, variant: "destructive", duration: 10000 });
      }
    } finally {
      setLoading(false);
    }
  }, [sportKey, region, markets, maxItems, toast, sportDisplayName]);

  useEffect(() => {
    if (sportKey) {
      loadOdds();
      const intervalId = setInterval(() => loadOdds(), REFRESH_INTERVAL_MS);
      return () => clearInterval(intervalId);
    } else {
      setError("Sport key not provided to LiveOddsDisplay component.");
      setLoading(false);
    }
  }, [sportKey, loadOdds]);

  if (loading && matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 my-4 text-muted-foreground bg-card rounded-lg shadow-lg min-h-[200px]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-lg">Loading {sportDisplayName} Odds...</p>
      </div>
    );
  }

  if (error && matches.length === 0) {
    return (
      <Card className="my-4 border-destructive bg-destructive/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading {sportDisplayName} Odds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm whitespace-pre-wrap">{error}</p>
          <Button onClick={() => loadOdds(true)} variant="outline" className="mt-4 border-destructive text-destructive hover:bg-destructive/20">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderTimeSinceUpdate = () => {
    if (!lastUpdated || !isValid(lastUpdated)) return null;
    return (
        <span className="text-xs text-muted-foreground">
            (Updated {formatDistanceToNowStrict(lastUpdated, { addSuffix: true })})
        </span>
    );
  };

  return (
    <Card className="my-6 shadow-xl bg-card border border-border/60">
      <CardHeader className="flex flex-row justify-between items-center pb-4 border-b border-border/60">
        <div>
          <CardTitle className="font-headline text-xl md:text-2xl flex items-center text-primary">
              <BarChartHorizontalBig className="mr-2 h-5 w-5 md:h-6 md:w-6" />
              {sportDisplayName} Odds
          </CardTitle>
          <CardDescription className="text-xs md:text-sm mt-1">
            Live odds from The Odds API. {renderTimeSinceUpdate()}
          </CardDescription>
        </div>
        <Button onClick={() => loadOdds(true)} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={loading}>
          <RefreshCw className={cn("h-5 w-5", {"animate-spin": loading && matches.length > 0})} />
          <span className="sr-only">Refresh Odds</span>
        </Button>
      </CardHeader>
      <CardContent className="pt-4 px-2 sm:px-4">
        {error && matches.length > 0 && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 whitespace-pre-wrap">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div>Could not refresh odds. Backend reported: "{error.length > 200 ? error.substring(0,200) + "..." : error}"</div>
            </div>
        )}
        {matches.length === 0 && !loading && !error && (
             <div className="text-center py-10 text-muted-foreground min-h-[150px] flex flex-col items-center justify-center">
                <Info className="h-10 w-10 mb-3 text-primary/50" />
                <p className="font-semibold">No upcoming or live {sportDisplayName.toLowerCase()} matches found.</p>
                <p className="text-sm">Please check back later or try refreshing.</p>
            </div>
        )}
        <div className="space-y-3">
          {matches.map((match) => {
            // Ensure a valid sportKey is used for the link.
            // Prioritize match.sportKey, then the component's sportKey prop.
            const linkSportKey = match.sportKey || sportKey; 
            return (
              <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow bg-background border border-border/50">
                <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                  <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
                        {match.homeTeam} vs {match.awayTeam}
                      </CardTitle>
                      {match.bookmakerTitle && <Badge variant="secondary" className="text-xs whitespace-nowrap shrink-0">{match.bookmakerTitle}</Badge>}
                  </div>
                  <CardDescription className="text-xs flex items-center pt-1 text-muted-foreground">
                    <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                    {formatMatchTime(match.commenceTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 px-3 sm:px-4">
                  {(match.homeWinOdds || match.awayWinOdds || match.drawOdds) && (
                    <div className="grid grid-cols-3 gap-2 text-center mt-1">
                      <div className="p-2.5 border rounded-md bg-muted/30 shadow-sm hover:bg-muted/50 transition-colors">
                        <div className="text-xs text-muted-foreground truncate">{match.homeTeam} (1)</div>
                        <div className="text-lg font-bold text-primary">{match.homeWinOdds?.toFixed(2) || '-'}</div>
                      </div>
                      <div className={cn("p-2.5 border rounded-md shadow-sm", match.drawOdds ? "bg-muted/30 hover:bg-muted/50" : "bg-transparent border-transparent pointer-events-none")}>
                         {match.drawOdds && (
                          <>
                            <div className="text-xs text-muted-foreground">Draw (X)</div>
                            <div className="text-lg font-bold text-primary">{match.drawOdds?.toFixed(2) || '-'}</div>
                          </>
                         )}
                      </div>
                      <div className="p-2.5 border rounded-md bg-muted/30 shadow-sm hover:bg-muted/50 transition-colors">
                        <div className="text-xs text-muted-foreground truncate">{match.awayTeam} (2)</div>
                        <div className="text-lg font-bold text-primary">{match.awayWinOdds?.toFixed(2) || '-'}</div>
                      </div>
                    </div>
                  )}
                  {match.totalsMarket && (match.totalsMarket.overOdds || match.totalsMarket.underOdds) && (
                    <div className="mt-3 pt-2 border-t border-border/30">
                      <p className="text-xs text-center text-muted-foreground mb-1.5 flex items-center justify-center">
                        <ArrowDownUp className="h-3 w-3 mr-1"/> Total Points/Goals: {match.totalsMarket.point}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 border rounded-md bg-muted/30 shadow-sm hover:bg-muted/50 transition-colors">
                          <div className="text-xs text-muted-foreground">Over {match.totalsMarket.point}</div>
                          <div className="text-lg font-bold text-primary">{match.totalsMarket.overOdds?.toFixed(2) || '-'}</div>
                        </div>
                        <div className="p-2.5 border rounded-md bg-muted/30 shadow-sm hover:bg-muted/50 transition-colors">
                          <div className="text-xs text-muted-foreground">Under {match.totalsMarket.point}</div>
                          <div className="text-lg font-bold text-primary">{match.totalsMarket.underOdds?.toFixed(2) || '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!match.homeWinOdds && !match.awayWinOdds && !match.drawOdds && !match.totalsMarket && (
                      <p className="text-sm text-muted-foreground text-center py-3">No odds available from {match.bookmakerTitle || 'this bookmaker'}.</p>
                  )}
                </CardContent>
                 <CardFooter className="px-3 sm:px-4 py-2.5 bg-muted/20 border-t border-border/50">
                   <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 w-full justify-center text-xs" asChild>
                     <Link href={`/match/${match.id}?sportKey=${linkSportKey}`}>View Match & Bet</Link>
                   </Button>
                 </CardFooter>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

