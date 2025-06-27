
import {
  fetchLiveFootballFixtures,
  fetchUpcomingFootballFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';
import HomeClientPage from './HomeClientPage';

async function getHomePageMatches() {
  try {
    // Fetch both live and upcoming football matches concurrently.
    // Catch errors for each fetch individually to ensure the page still loads if one API fails.
    const [
      liveFootball,
      upcomingFootball,
    ] = await Promise.all([
      fetchLiveFootballFixtures().catch(e => { console.error("Error fetching live football:", e.message); return []; }),
      fetchUpcomingFootballFixtures().catch(e => { console.error("Error fetching upcoming football:", e.message); return []; }),
    ]);

    // Use a Map to store unique matches by ID. This is a crucial step to de-duplicate.
    // If a match is both in 'upcoming' and 'live', the 'live' version will overwrite the 'upcoming' one.
    const uniqueMatches = new Map<number, ProcessedFixture>();

    // Add upcoming matches to the map first.
    upcomingFootball.forEach(match => {
      if (match && match.id) {
        uniqueMatches.set(match.id, match);
      }
    });

    // Add live matches to the map. This will overwrite any duplicates with the live data.
    liveFootball.forEach(match => {
      if (match && match.id) {
        uniqueMatches.set(match.id, match);
      }
    });

    // Convert the map back to an array of distinct matches.
    const distinctMatches = Array.from(uniqueMatches.values());

    // Filter out any matches that have already finished.
    const activeMatches = distinctMatches.filter(match => !match.isFinished);

    // Sort the combined list: live matches first, then upcoming matches by start time.
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
