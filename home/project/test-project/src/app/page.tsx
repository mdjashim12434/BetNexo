
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
    // Fetch live and upcoming matches concurrently for better performance and reliability.
    // Using Promise.allSettled to ensure that even if one fails, the other can still be displayed.
    const [liveResult, upcomingResult] = await Promise.allSettled([
      fetchLiveFootballFixtures(undefined, true), // Fetch only the first page for the homepage
      fetchUpcomingFootballFixtures(undefined, true), // Fetch only the first page for the homepage
    ]);

    if (liveResult.status === 'fulfilled') {
      liveMatches = liveResult.value;
    } else {
      console.error("Home page: Failed to fetch live matches:", liveResult.reason);
      // We can accumulate errors if needed, but for now let's just show one.
      if (!error) error = liveResult.reason.message || "Could not fetch live matches.";
    }

    if (upcomingResult.status === 'fulfilled') {
      upcomingMatches = upcomingResult.value;
    } else {
      console.error("Home page: Failed to fetch upcoming matches:", upcomingResult.reason);
      if (!error) error = upcomingResult.reason.message || "Could not fetch upcoming matches.";
    }
    
    // Ensure no live matches appear in the upcoming list.
    const liveMatchIds = new Set(liveMatches.map(m => m.id));
    upcomingMatches = upcomingMatches.filter(m => !liveMatchIds.has(m.id));

    // Sort both lists by their starting time for a consistent order.
    liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
    upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

  } catch (e: any) {
    console.error("Home page: A critical error occurred in getHomePageMatches:", e);
    // Let's provide a more specific message if the API key is missing
    if (e.message && e.message.includes("API key is not configured")) {
       error = "The Sportmonks API Key is missing. Please add it to your .env file to see match data.";
    } else {
       error = e.message || "An unexpected error occurred while fetching matches.";
    }
  }

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
