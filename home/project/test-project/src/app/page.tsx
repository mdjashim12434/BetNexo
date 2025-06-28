
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
  const errorMessages: string[] = [];
  
  // Use Promise.allSettled to fetch both live and upcoming matches concurrently and robustly.
  // This prevents one failed request from blocking the other.
  const results = await Promise.allSettled([
    fetchLiveFootballFixtures(undefined, true), // Fetch first page of live matches
    fetchUpcomingFootballFixtures(undefined, true), // Fetch first page of upcoming matches
  ]);

  // Process live matches result
  if (results[0].status === 'fulfilled') {
    liveMatches = results[0].value;
  } else {
    console.error("Home page: Failed to fetch live matches:", results[0].reason);
    errorMessages.push(results[0].reason?.message || "Could not fetch live matches.");
  }

  // Process upcoming matches result
  if (results[1].status === 'fulfilled') {
    upcomingMatches = results[1].value;
  } else {
    console.error("Home page: Failed to fetch upcoming matches:", results[1].reason);
    errorMessages.push(results[1].reason?.message || "Could not fetch upcoming matches.");
  }

  // Combine error messages if any request failed.
  if (errorMessages.length > 0) {
      if(errorMessages.some(msg => msg.includes("API key is not configured"))) {
           error = "The Sportmonks API Key is missing. Please add it to your .env file to see match data.";
      } else {
           error = errorMessages.join(' ');
      }
  }

  // Ensure no duplicates: if a match is live, it shouldn't be in upcoming.
  const liveMatchIds = new Set(liveMatches.map(m => m.id));
  const uniqueUpcomingMatches = upcomingMatches.filter(m => !liveMatchIds.has(m.id));

  // Sort both lists by their starting time for a consistent order.
  liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
  uniqueUpcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

  // Return the processed, separated, and sliced arrays for the home page.
  return { 
    liveMatches: liveMatches.slice(0, 10), 
    upcomingMatches: uniqueUpcomingMatches.slice(0, 10), 
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
