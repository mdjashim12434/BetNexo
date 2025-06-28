
import {
  fetchLiveFootballFixtures,
  fetchUpcomingFootballFixtures,
} from '@/services/sportmonksAPI';
import HomeClientPage from './HomeClientPage';
import type { ProcessedFixture } from '@/types/sportmonks';

async function getHomePageMatches() {
  let liveMatches: ProcessedFixture[] = [];
  let upcomingMatches: ProcessedFixture[] = [];
  let error: string | null = null;
  
  try {
    // Fetch both in parallel for performance, only getting the first page for the homepage.
    const [liveResult, upcomingResult] = await Promise.allSettled([
      fetchLiveFootballFixtures(undefined, true),
      fetchUpcomingFootballFixtures(undefined, true)
    ]);

    if (liveResult.status === 'fulfilled') {
      liveMatches = liveResult.value;
    } else {
      console.error("Home page: Failed to fetch live matches:", liveResult.reason);
      error = (liveResult.reason as Error).message || "Could not fetch live matches.";
    }

    if (upcomingResult.status === 'fulfilled') {
      // Ensure there are no duplicates if a live match also appears in upcoming
      const liveMatchIds = new Set(liveMatches.map(m => m.id));
      upcomingMatches = upcomingResult.value.filter(m => !liveMatchIds.has(m.id));
    } else {
      console.error("Home page: Failed to fetch upcoming matches:", upcomingResult.reason);
      const upcomingError = (upcomingResult.reason as Error).message || "Could not fetch upcoming matches.";
      // Append error message
      error = error ? `${error}\n${upcomingError}` : upcomingError;
    }

  } catch (e: any) {
    // This would catch issues with Promise.allSettled itself, which is unlikely.
    console.error("Home page: Generic failure fetching matches:", e);
    error = e.message || "An unexpected error occurred while fetching matches.";
  }

  // Sort and slice the results.
  liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
  upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

  return { 
    liveMatches: liveMatches.slice(0, 10), 
    upcomingMatches: upcomingMatches.slice(0, 10), 
    error: error 
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
