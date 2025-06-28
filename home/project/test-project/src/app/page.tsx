
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
    // Fetch live and upcoming matches concurrently for better performance.
    // The `firstPageOnly` flag is used to limit the data for the homepage, making it faster.
    const [liveResult, upcomingResult] = await Promise.allSettled([
      fetchLiveFootballFixtures(undefined, true),
      fetchUpcomingFootballFixtures(undefined, true)
    ]);

    if (liveResult.status === 'fulfilled') {
      liveMatches = liveResult.value;
    } else {
      console.error("Home page: Failed to fetch live matches:", liveResult.reason);
      const reason = liveResult.reason as Error;
      error = (error ? error + '\n' : '') + (reason.message || "Could not fetch live matches.");
    }

    if (upcomingResult.status === 'fulfilled') {
      upcomingMatches = upcomingResult.value;
    } else {
      console.error("Home page: Failed to fetch upcoming matches:", upcomingResult.reason);
      const reason = upcomingResult.reason as Error;
      error = (error ? error + '\n' : '') + (reason.message || "Could not fetch upcoming matches.");
    }
    
    // Ensure there are no duplicates if a match is both live and in the upcoming feed
    const liveMatchIds = new Set(liveMatches.map(m => m.id));
    const uniqueUpcomingMatches = upcomingMatches.filter(match => !liveMatchIds.has(match.id));

    // Sort both lists by their starting time for a consistent order.
    liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
    uniqueUpcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

    return { 
      liveMatches: liveMatches.slice(0, 10), 
      upcomingMatches: uniqueUpcomingMatches.slice(0, 10), 
      error: error
    };
    
  } catch (e: any) {
    // This is a fallback for any unexpected error in the Promise.allSettled logic itself.
    console.error("Home page: Unexpected error in getHomePageMatches:", e);
    error = e.message || "An unexpected error occurred while fetching matches.";
    return { liveMatches: [], upcomingMatches: [], error };
  }
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
