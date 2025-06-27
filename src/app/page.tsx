
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

    // Combine all matches into one list. Put live matches first to give them priority.
    const allMatchesCombined = [...liveMatches, ...allTodaysMatches];

    // Use a Map to de-duplicate, ensuring we only keep the first occurrence of each match ID.
    // Since liveMatches are first in the array, they will be the ones kept if duplicates exist.
    const uniqueMatchesMap = new Map<number, ProcessedFixture>();
    allMatchesCombined.forEach(match => {
        if (!uniqueMatchesMap.has(match.id)) {
            uniqueMatchesMap.set(match.id, match);
        }
    });

    // Filter out finished matches from the unique list
    const activeMatches = Array.from(uniqueMatchesMap.values()).filter(match => !match.isFinished);
    
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
