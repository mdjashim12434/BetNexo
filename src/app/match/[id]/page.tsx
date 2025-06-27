
'use client'; // This page now fetches data client-side

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation'; // For App Router
import AppLayout from '@/components/AppLayout';
import type { ProcessedFixture } from '@/types/sportmonks';
import MatchDetailClientContent from '@/components/match/MatchDetailClientContent';
import { fetchFixtureDetails } from '@/services/sportmonksAPI';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MatchDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const matchId = params.id as string;
  const sport = searchParams.get('sport') as 'football' | 'cricket' | null;

  const [match, setMatch] = useState<ProcessedFixture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchId && sport) {
      console.log(`MatchDetailPage Client: Fetching ${sport} fixtureId: ${matchId}`);
      setLoading(true);
      setError(null);
      fetchFixtureDetails(Number(matchId), sport)
        .then(apiFixture => {
          if (apiFixture) {
            console.log(`MatchDetailPage Client: Found API fixture ${matchId}. Transformed.`);
            setMatch(apiFixture);
          } else {
            console.warn(`MatchDetailPage Client: API fixture ${matchId} not found.`);
            setError(`Match with ID ${matchId} not found. The match might no longer be available or the API did not return data for it.`);
          }
        })
        .catch(err => {
          console.error(`MatchDetailPage Client: Error fetching fixture ${matchId}:`, err);
          setError(err.message || `Failed to fetch match details for ${sport}.`);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('Match ID or Sport is missing from the URL. Example: /match/123?sport=football');
      setLoading(false);
    }
  }, [matchId, sport]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container py-6">
          <div className="space-y-6">
            <Skeleton className="h-10 w-32" /> {/* Back button skeleton */}
            <Skeleton className="h-96 w-full" /> {/* Main card skeleton */}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container py-6">
           <Button variant="outline" onClick={() => router.back()} className="self-start mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
            </Button>
          <div className="text-center p-10 bg-destructive/10 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Match</h1>
            <p className="text-muted-foreground whitespace-pre-wrap">{error}</p>
            <p className="text-muted-foreground mt-2">This could be due to an invalid link or an API issue.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!match) {
     return (
      <AppLayout>
        <div className="container py-6">
          <div className="text-center p-10">
            <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
            <p className="text-muted-foreground">Could not find details for match ID: {matchId}.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <MatchDetailClientContent initialMatch={match} />
      </div>
    </AppLayout>
  );
}
