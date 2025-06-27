
import {
  fetchAllTodaysFootballFixtures,
} from '@/services/sportmonksAPI';
import HomeClientPage from './HomeClientPage';

async function getHomePageMatches() {
  try {
    // SINGLE, RELIABLE CALL: Fetch all of today's matches.
    // This single source of truth is more reliable than merging /livescores and another endpoint.
    const allTodaysMatches = await fetchAllTodaysFootballFixtures().catch(e => {
        console.error("Error fetching today's football matches for home page:", e.message);
        return [];
      });

    // The processing in `fetchAllTodaysFootballFixtures` already sets `isLive`, `isFinished` etc.
    // So we just need to filter and sort the results from this single, authoritative list.

    // Filter out finished matches
    const activeMatches = allTodaysMatches.filter(match => !match.isFinished);
    
    // Sort the list to ensure live matches are always first, followed by upcoming matches sorted by time.
    activeMatches.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
    });

    // Return a slice of the top matches.
    return { matches: activeMatches.slice(0, 20), error: null };
    
  } catch (error) {
    console.error('Error in getHomePageMatches:', error);
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
