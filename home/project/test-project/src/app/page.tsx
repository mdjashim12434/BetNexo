
import HomeClientPage from './HomeClientPage';
import type { ProcessedFixture } from '@/types/sportmonks';
import { getLiveScoresFromServer, getUpcomingFixturesFromServer } from '@/lib/sportmonks-server';
import { processV3FootballFixtures } from '@/services/sportmonksAPI';

async function getHomePageMatches() {
  let liveMatches: ProcessedFixture[] = [];
  let upcomingMatches: ProcessedFixture[] = [];
  let error: string | null = null;
  const errorMessages: string[] = [];
  
  try {
    const [liveResult, upcomingResult] = await Promise.allSettled([
      getLiveScoresFromServer(undefined, true),
      getUpcomingFixturesFromServer(undefined, true)
    ]);

    if (liveResult.status === 'fulfilled' && liveResult.value) {
      liveMatches = processV3FootballFixtures(liveResult.value);
    } else if (liveResult.status === 'rejected') {
      const reason = (liveResult.reason as Error).message || "Could not fetch live matches.";
      console.error("Home page: Failed to fetch live matches:", reason);
      errorMessages.push(`Error fetching live matches: ${reason}`);
    }

    if (upcomingResult.status === 'fulfilled' && upcomingResult.value) {
      const liveMatchIds = new Set(liveMatches.map(m => m.id));
      const processedUpcoming = processV3FootballFixtures(upcomingResult.value);
      const now = new Date();
      // Filter for truly upcoming matches and exclude any that might be live now.
      upcomingMatches = processedUpcoming.filter(m => !liveMatchIds.has(m.id) && new Date(m.startingAt) > now);
    } else if (upcomingResult.status === 'rejected') {
      const reason = (upcomingResult.reason as Error).message || "Could not fetch upcoming matches.";
      console.error("Home page: Failed to fetch upcoming matches:", reason);
      errorMessages.push(`Error fetching upcoming matches: ${reason}`);
    }

    if (errorMessages.length > 0) {
      error = errorMessages.join('\n\n');
    }

  } catch (e: any) {
    console.error("Home page: Generic failure fetching matches:", e);
    error = e.message || "An unexpected error occurred while fetching matches.";
  }

  liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
  upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

  return { 
    liveMatches: liveMatches.slice(0, 10), 
    upcomingMatches: upcomingMatches.slice(0, 10), 
    error
  };
}


export default async function HomePage() {
  const { liveMatches, upcomingMatches, error } = await getHomePageMatches();

  return (
    <HomeClientPage
      initialLiveMatches={liveMatches}
      initialUpcomingMatches={upcomingMatches}
      initialError={error}
    />
  );
}
