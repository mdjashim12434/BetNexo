
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
    // Fetch both in parallel, but don't fail the page if one call errors
    const [liveResult, upcomingResult] = await Promise.allSettled([
      fetchLiveFootballFixtures(undefined, true), // Fetch first page for homepage
      fetchUpcomingFootballFixtures(undefined, true) // Fetch first page for homepage
    ]);

    if (liveResult.status === 'fulfilled') {
      liveMatches = liveResult.value;
    } else {
      console.error("Home page: Failed to fetch live matches:", liveResult.reason);
      const reason = liveResult.reason as Error;
      error = (error ? error + '\n' : '') + `Could not fetch live matches. Reason: ${reason?.message || 'Unknown'}`;
    }

    if (upcomingResult.status === 'fulfilled') {
      upcomingMatches = upcomingResult.value;
    } else {
      console.error("Home page: Failed to fetch upcoming matches:", upcomingResult.reason);
      const reason = upcomingResult.reason as Error;
      error = (error ? error + '\n' : '') + `Could not fetch upcoming matches. Reason: ${reason?.message || 'Unknown'}`;
    }
    
  } catch (e: any) {
    console.error("Home page: Unexpected error fetching matches:", e);
    error = e.message || "An unknown error occurred while fetching matches.";
  }

  // Sort both lists by their starting time for a consistent order.
  liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
  upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

  // Return the processed, separated, and sliced arrays for the home page.
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
