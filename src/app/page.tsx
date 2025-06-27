
import {
  fetchLiveFootballFixtures,
  fetchAllTodaysFootballFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';
import HomeClientPage from './HomeClientPage';

async function getHomePageMatches() {
  try {
    // Fetch live matches and all of today's matches in parallel for efficiency.
    const [liveMatches, allTodaysMatches] = await Promise.all([
      fetchLiveFootballFixtures().catch(e => {
        console.error("Error fetching live football matches:", e.message);
        return [];
      }),
      fetchAllTodaysFootballFixtures().catch(e => {
        console.error("Error fetching today's football matches:", e.message);
        return [];
      })
    ]);

    // Create a Set of live match IDs for efficient lookup to avoid duplicates.
    const liveMatchIds = new Set(liveMatches.map(match => match.id));

    // Filter today's matches to get only the ones that are NOT live and NOT finished.
    // This gives us a clean list of upcoming matches.
    const upcomingMatches = allTodaysMatches.filter(match => 
      !liveMatchIds.has(match.id) && !match.isFinished
    );

    // Combine the two lists. Live matches will naturally come first.
    const activeMatches = [...liveMatches, ...upcomingMatches];
    
    // Sort the list to ensure live matches are always first, followed by upcoming matches sorted by time.
    activeMatches.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
    });

    // Return a slice of the top matches.
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
