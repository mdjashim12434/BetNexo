
import {
  fetchAllTodaysFootballFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';
import HomeClientPage from './HomeClientPage';

async function getHomePageMatches() {
  try {
    // Fetch all of today's football matches from a single, reliable source.
    const allTodaysMatches = await fetchAllTodaysFootballFixtures().catch(e => { 
        console.error("Error fetching today's football matches:", e.message); 
        return []; 
    });

    // Filter out any matches that have already finished.
    const activeMatches = allTodaysMatches.filter(match => !match.isFinished);

    // Sort the list: live matches first, then upcoming matches by start time.
    activeMatches.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1; // a (live) comes before b (not live)
      if (!a.isLive && b.isLive) return 1;  // b (live) comes before a (not live)

      // If both are live or both are upcoming, sort by start time.
      return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
    });

    // Return a slice of the top matches to keep the homepage clean.
    return { matches: activeMatches.slice(0, 20), error: null };
    
  } catch (error) {
    console.error('Error fetching matches for home page:', error);
    return {
      matches: [],
      error:
        (error as Error).message ||
        'An unknown error occurred while fetching matches.',
    };
  }
}

export default async function HomePage() {
  const { matches, error } = await getHomePageMatches();

  return (
    <HomeClientPage
      initialMatches={matches}
      initialError={error}
    />
  );
}
