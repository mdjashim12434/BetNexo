
import {
  fetchTodaysFootballFixtures,
} from '@/services/sportmonksAPI';
import HomeClientPage from './HomeClientPage';
import type { ProcessedFixture } from '@/types/sportmonks';

async function getHomePageMatches() {
  let allTodaysMatches: ProcessedFixture[] = [];
  let error: string | null = null;
  
  try {
    allTodaysMatches = await fetchTodaysFootballFixtures();
  } catch (e: any) {
    console.error("Home page: Failed to fetch today's football matches:", e);
    // Let's provide a more specific message if the API key is missing or invalid
    if (e.message && (e.message.includes("API key is not configured") || e.message.includes("Authentication Failed"))) {
       error = "The Sportmonks API Key is missing or invalid. Please add it to your .env file to see match data.";
    } else {
       error = e.message || "Could not fetch today's football matches.";
    }
  }

  const now = new Date();
  
  // Split today's matches into live and upcoming
  const liveMatches = allTodaysMatches.filter(m => m.isLive && !m.isFinished);
  const upcomingMatches = allTodaysMatches.filter(m => !m.isLive && !m.isFinished && new Date(m.startingAt) > now);

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
