
'use client'; // This page now fetches data client-side

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // For App Router
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
  const router = useRouter();

  const matchId = params.id as string;

  const [match, setMatch] = useState<ProcessedFixture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchId) {
      const numericMatchId = Number(matchId);
      // Validate that the matchId is a valid number before making an API call.
      if (isNaN(numericMatchId)) {
        setError(`Invalid Match ID provided: "${matchId}". The link may be broken or incorrect.`);
        setLoading(false);
        return;
      }

      console.log(`MatchDetailPage Client: Fetching football fixtureId: ${numericMatchId}`);
      setLoading(true);
      setError(null);
      fetchFixtureDetails(numericMatchId)
        .then(apiFixture => {
          if (apiFixture) {
            console.log(`MatchDetailPage Client: Found API fixture ${numericMatchId}. Transformed.`);
            setMatch(apiFixture);
          } else {
            console.warn(`MatchDetailPage Client: API fixture ${numericMatchId} not found.`);
            setError(`Match with ID ${numericMatchId} not found. The match might no longer be available or the API did not return data for it.`);
          }
        })
        .catch(err => {
          console.error(`MatchDetailPage Client: Error fetching fixture ${numericMatchId}:`, err);
          setError(err.message || `Failed to fetch match details for football.`);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('Match ID is missing from the URL.');
      setLoading(false);
    }
  }, [matchId]);

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
          <Button variant="outline" onClick={() => router.back()} className="self-start mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
          </Button>
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
