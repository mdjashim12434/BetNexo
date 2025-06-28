
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
    // Fetch live and upcoming separately and in parallel for robustness
    const [liveResult, upcomingResult] = await Promise.allSettled([
        fetchLiveFootballFixtures(undefined, true), // Fetch first page only for homepage
        fetchUpcomingFootballFixtures(undefined, true) // Fetch first page only for homepage
    ]);

    if (liveResult.status === 'fulfilled') {
        liveMatches = liveResult.value;
    } else {
        console.error("Home page: Failed to fetch live matches:", liveResult.reason);
        // Don't set the main error message for a partial failure, to allow other data to show
    }
    
    if (upcomingResult.status === 'fulfilled') {
        // Ensure upcoming matches are not already in the live list
        const liveMatchIds = new Set(liveMatches.map(m => m.id));
        upcomingMatches = upcomingResult.value.filter(match => !liveMatchIds.has(match.id));
    } else {
        console.error("Home page: Failed to fetch upcoming matches:", upcomingResult.reason);
    }
    
    // Combine errors only if both failed, providing a more specific message
    if (liveResult.status === 'rejected' && upcomingResult.status === 'rejected') {
         const errorMessage = (liveResult.reason as Error)?.message || (upcomingResult.reason as Error)?.message || "Could not fetch any matches.";
         if (errorMessage.includes("API key is not configured")) {
            error = "The Sportmonks API Key is missing. Please add it to your .env file to see match data.";
         } else {
            error = errorMessage;
         }
    }
    
  } catch (e: any) {
    console.error("Home page: Unexpected error in getHomePageMatches:", e);
    error = e.message || "An unexpected error occurred while fetching matches.";
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
