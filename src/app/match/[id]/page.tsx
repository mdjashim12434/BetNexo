
'use client'; // This page now fetches data client-side

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // For App Router
import AppLayout from '@/components/AppLayout';
import type { ProcessedFixture } from '@/types/sportmonks';
import MatchDetailClientContent from '@/components/match/MatchDetailClientContent';
import { fetchFixtureById, processFixtureData } from '@/services/sportmonksAPI';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state


export default function MatchDetailPage() {
  const params = useParams();

  const matchId = params.id as string;

  const [match, setMatch] = useState<ProcessedFixture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchId) {
      console.log(`MatchDetailPage Client: Fetching fixtureId: ${matchId}`);
      setLoading(true);
      setError(null);
      fetchFixtureById(Number(matchId))
        .then(apiFixture => {
          if (apiFixture) {
            console.log(`MatchDetailPage Client: Found API fixture ${matchId}. Transforming.`);
            setMatch(processFixtureData([apiFixture])[0]);
          } else {
            console.warn(`MatchDetailPage Client: API fixture ${matchId} not found.`);
            setError(`Match with ID ${matchId} not found. The match might no longer be available or the API did not return data for it.`);
          }
        })
        .catch(err => {
          console.error(`MatchDetailPage Client: Error fetching fixture ${matchId}:`, err);
          setError(err.message || 'Failed to fetch match details.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('Match ID is missing.');
      setLoading(false);
    }
  }, [matchId]);

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
          <p className="text-muted-foreground mt-2">This could be due to an invalid link or an API issue.</p>
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
