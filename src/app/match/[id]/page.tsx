
'use client'; // This page now fetches data client-side

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation'; // For App Router
import AppLayout from '@/components/AppLayout';
import type { Match } from '@/components/sports/MatchCard';
import MatchDetailClientContent from '@/components/match/MatchDetailClientContent';
import { fetchSportsOdds } from '@/services/oddsAPI';
import type { SimplifiedMatchOdds } from '@/types/odds';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// Helper function to transform SimplifiedMatchOdds to Match for display
function transformApiMatchToDisplayMatch(apiMatch: SimplifiedMatchOdds): Match {
  let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
  const commenceDateTime = new Date(apiMatch.commenceTime);
  const now = new Date();
  
  // A simple heuristic for status. Could be refined.
  // If commenceTime is in the past, assume live if odds are present, otherwise finished.
  // If commenceTime is in the future, it's upcoming.
  if (commenceDateTime <= now) {
    // Check if any primary odds are present for "live" status
    const hasAnyOdds = apiMatch.homeWinOdds || apiMatch.awayWinOdds || apiMatch.drawOdds || 
                       apiMatch.totalsMarket?.overOdds || apiMatch.totalsMarket?.underOdds ||
                       apiMatch.bttsMarket?.yesOdds || apiMatch.bttsMarket?.noOdds;
    status = hasAnyOdds ? 'live' : 'finished'; 
  }


  return {
    id: apiMatch.id,
    sportKey: apiMatch.sportKey,
    homeTeam: apiMatch.homeTeam,
    awayTeam: apiMatch.awayTeam,
    commenceTime: apiMatch.commenceTime,
    sportTitle: apiMatch.sportTitle,
    league: apiMatch.sportTitle, // Or derive from elsewhere if available
    homeWinOdds: apiMatch.homeWinOdds,
    awayWinOdds: apiMatch.awayWinOdds,
    drawOdds: apiMatch.drawOdds,
    totalsMarket: apiMatch.totalsMarket,
    bttsMarket: apiMatch.bttsMarket,
    drawNoBetMarket: apiMatch.drawNoBetMarket,
    doubleChanceMarket: apiMatch.doubleChanceMarket,
    imageUrl: `https://placehold.co/800x400.png?text=${encodeURIComponent(apiMatch.homeTeam)}+vs+${encodeURIComponent(apiMatch.awayTeam)}`,
    imageAiHint: `${apiMatch.sportTitle.toLowerCase().split('_')[0]} game`, // e.g. "soccer game"
    status: status,
  };
}


export default function MatchDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const matchId = params.id as string;
  const sportKey = searchParams.get('sportKey');

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchId && sportKey) {
      console.log(`MatchDetailPage Client: Fetching odds for sportKey: ${sportKey} to find matchId: ${matchId}`);
      setLoading(true);
      setError(null);
      // Request a comprehensive set of markets for the detail page
      fetchSportsOdds(sportKey, 'uk', 'h2h,totals,btts,draw_no_bet,double_chance')
        .then(allMatchesForSport => {
          const apiMatch = allMatchesForSport.find(m => m.id === matchId);
          if (apiMatch) {
            console.log(`MatchDetailPage Client: Found API match ${matchId} in sportKey ${sportKey}. Transforming.`);
            setMatch(transformApiMatchToDisplayMatch(apiMatch));
          } else {
            console.warn(`MatchDetailPage Client: API match ${matchId} not found in sportKey ${sportKey} results. This might be due to the match not being active or available from the API for the requested markets.`);
            setError(`Match with ID ${matchId} not found for sport ${sportKey}. The match might no longer be available or the API did not return data for it.`);
          }
        })
        .catch(err => {
          console.error(`MatchDetailPage Client: Error fetching odds for sportKey ${sportKey} to find match ${matchId}:`, err);
          setError(err.message || 'Failed to fetch match details.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (matchId && !sportKey) {
      setError(`Sport key not provided for match ID: ${matchId}. Cannot fetch details.`);
      setLoading(false);
    } else {
      setError('Match ID or Sport Key is missing.');
      setLoading(false);
    }
  }, [matchId, sportKey]);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" /> {/* Back button skeleton */}
          <Skeleton className="h-96 w-full" /> {/* Main card skeleton */}
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center p-10">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Match</h1>
          <p className="text-muted-foreground whitespace-pre-wrap">{error}</p>
          <p className="text-muted-foreground mt-2">This could be due to an invalid link, an API issue, or the match is no longer available with the requested markets.</p>
        </div>
      </AppLayout>
    );
  }

  if (!match) {
     return (
      <AppLayout>
        <div className="text-center p-10">
          <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
          <p className="text-muted-foreground">Could not find details for match ID: {matchId}.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <MatchDetailClientContent initialMatch={match} />
    </AppLayout>
  );
}
