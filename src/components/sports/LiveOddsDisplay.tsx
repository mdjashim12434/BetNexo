
'use client';

import { useEffect, useState } from 'react';
import { fetchSportsOdds, type SimplifiedMatchOdds } from '@/services/oddsAPI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, BarChartHorizontalBig, CalendarClock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Assuming Button might be used for actions later

interface LiveOddsDisplayProps {
  sportKey: string; 
  sportDisplayName: string;
  region?: string;
  maxItems?: number;
}

export default function LiveOddsDisplay({ sportKey, sportDisplayName, region = 'uk', maxItems = 3 }: LiveOddsDisplayProps) {
  const [matches, setMatches] = useState<SimplifiedMatchOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOdds() {
      setLoading(true);
      setError(null);
      try {
        const fetchedMatches = await fetchSportsOdds(sportKey, region);
        setMatches(fetchedMatches.slice(0, maxItems));
      } catch (err: any) {
        console.error(`Error in LiveOddsDisplay for ${sportKey}:`, err);
        let errorMessage = 'Failed to load odds. ';
        if (err.message && err.message.includes("API_KEY")) {
            errorMessage += "The API key might be missing or invalid. Please check the console for more details.";
        } else if (err.message && err.message.includes("The Odds API")) {
            errorMessage += err.message; // Use specific message from Odds API if available
        } else {
            errorMessage += 'This could be due to API request limits or network issues. The API key is currently hardcoded in `src/services/oddsAPI.ts` which is insecure for production; it should be moved to a backend.';
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    if (sportKey) { // Only fetch if sportKey is provided
        loadOdds();
    } else {
        setError("Sport key not provided to LiveOddsDisplay component.");
        setLoading(false);
    }
  }, [sportKey, region, maxItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 my-4 text-muted-foreground bg-card rounded-lg shadow">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
        Loading {sportDisplayName} Odds...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="my-4 border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading {sportDisplayName} Odds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="my-4">
        <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center">
                <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" /> Live {sportDisplayName} Odds
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-center py-6">
                No upcoming or live {sportDisplayName.toLowerCase()} matches with odds found for the "{region}" region via The Odds API.
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
            <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
            Live {sportDisplayName} Odds
        </CardTitle>
        <CardDescription>Odds from The Odds API. For informational purposes. Bet responsibly.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow bg-muted/20">
              <CardHeader className="pb-3 pt-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold truncate pr-2">
                    {match.homeTeam} vs {match.awayTeam}
                    </CardTitle>
                    {match.bookmakerTitle && <Badge variant="secondary" className="text-xs whitespace-nowrap">{match.bookmakerTitle}</Badge>}
                </div>
                <CardDescription className="text-xs flex items-center pt-1">
                  <CalendarClock className="mr-1.5 h-3 w-3" />
                  {format(match.commenceTime, 'MMM d, yyyy h:mm a')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                {(match.homeWinOdds || match.awayWinOdds || match.drawOdds) ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 border rounded-md bg-background shadow-sm">
                      <div className="text-xs text-muted-foreground truncate">{match.homeTeam} (1)</div>
                      <div className="text-md font-bold text-primary">{match.homeWinOdds?.toFixed(2) || 'N/A'}</div>
                    </div>
                    {match.drawOdds && (
                      <div className="p-2.5 border rounded-md bg-background shadow-sm">
                        <div className="text-xs text-muted-foreground">Draw (X)</div>
                        <div className="text-md font-bold text-primary">{match.drawOdds?.toFixed(2) || 'N/A'}</div>
                      </div>
                    )}
                    {/* If no draw odds, ensure 3 columns by possibly adding a placeholder or adjusting grid */}
                    {!match.drawOdds && <div className="p-2.5 border rounded-md bg-background/0 border-transparent"></div>} 
                    <div className="p-2.5 border rounded-md bg-background shadow-sm">
                      <div className="text-xs text-muted-foreground truncate">{match.awayTeam} (2)</div>
                      <div className="text-md font-bold text-primary">{match.awayWinOdds?.toFixed(2) || 'N/A'}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-3">No H2H odds available for this match from the selected bookmaker.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

