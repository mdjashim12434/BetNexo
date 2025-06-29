
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFixtureDetailsFromServer } from '@/lib/sportmonks-server';
import { processV3FootballFixtures } from '@/services/sportmonksAPI';
import MatchDetailClientContent from '@/components/match/MatchDetailClientContent';
import type { ProcessedFixture } from '@/types/sportmonks';
import BottomNav from '@/components/navigation/BottomNav';

interface MatchDetailPageProps {
  params: { id: string };
}

async function getMatchDetails(id: string): Promise<{ match: ProcessedFixture | null; error: string | null }> {
  const numericMatchId = Number(id);
  if (isNaN(numericMatchId)) {
    return { match: null, error: `Invalid Match ID provided: "${id}". The link may be broken or incorrect.` };
  }

  try {
    console.log(`MatchDetailPage Server: Fetching football fixtureId: ${numericMatchId}`);
    const apiFixture = await getFixtureDetailsFromServer(numericMatchId);
    
    if (!apiFixture) {
       console.warn(`MatchDetailPage Server: API fixture ${numericMatchId} not found.`);
      return { match: null, error: `Match with ID ${numericMatchId} not found.` };
    }

    const processedFixtures = processV3FootballFixtures([apiFixture]);
    const match = processedFixtures[0] || null;

    if (!match) {
        console.warn(`MatchDetailPage Server: Failed to process fixture ${numericMatchId}.`);
        return { match: null, error: `Could not process data for match ID ${numericMatchId}.` };
    }

    return { match, error: null };
  } catch (err: any) {
    console.error(`MatchDetailPage Server: Error fetching fixture ${id}:`, err);
    return { match: null, error: err.message || `Failed to fetch match details.` };
  }
}


export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = params;
  const { match, error } = await getMatchDetails(id);

  if (error) {
     return (
      <AppLayout>
        <div className="container py-6">
          <Button variant="outline" asChild className="self-start mb-6">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches</Link>
          </Button>
          <div className="text-center p-10 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Match</h1>
            <p className="text-muted-foreground whitespace-pre-wrap">{error}</p>
            <p className="text-muted-foreground mt-2">This could be due to an invalid link or an API issue.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!match) {
    notFound();
  }
  
  return (
    <AppLayout>
        <div className="pb-24">
            <MatchDetailClientContent initialMatch={match} />
            <BottomNav />
        </div>
    </AppLayout>
  );
}
