
import {
  fetchLiveFootballFixtures,
  fetchUpcomingFootballFixtures,
  fetchLiveCricketFixtures,
  fetchUpcomingCricketFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';
import HomeClientPage from './HomeClientPage';

async function getHomePageMatches() {
  try {
    // Fetch all categories of matches concurrently for better performance
    const [
      liveFootball,
      liveCricket,
      upcomingFootball,
      upcomingCricket,
    ] = await Promise.all([
      fetchLiveFootballFixtures().catch(e => { console.error("Error fetching live football:", e.message); return []; }),
      fetchLiveCricketFixtures().catch(e => { console.error("Error fetching live cricket:", e.message); return []; }),
      fetchUpcomingFootballFixtures().catch(e => { console.error("Error fetching upcoming football:", e.message); return []; }),
      fetchUpcomingCricketFixtures().catch(e => { console.error("Error fetching upcoming cricket:", e.message); return []; }),
    ]);

    // Use a Map to store unique matches by ID.
    const uniqueMatches = new Map<number, ProcessedFixture>();

    // Combine all matches, with upcoming matches first so that live data can overwrite them.
    const allFetchedMatches = [
      ...upcomingFootball,
      ...upcomingCricket,
      ...liveFootball,
      ...liveCricket,
    ];

    // Populate the map. If a key (match.id) already exists, its value will be overwritten by the later entry.
    // This ensures that live data always takes precedence over upcoming data for the same match.
    allFetchedMatches.forEach(match => {
      if (match && match.id) { // Ensure match and match.id are valid
        uniqueMatches.set(match.id, match);
      }
    });

    const distinctMatches = Array.from(uniqueMatches.values());

    // Filter out finished matches before sorting
    const activeMatches = distinctMatches.filter(match => !match.isFinished);

    // Sort the combined list: live matches first, then by start time
    activeMatches.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1; // a (live) comes before b (not live)
      if (!a.isLive && b.isLive) return 1;  // b (live) comes before a (not live)

      // If both are live or both are upcoming, sort by start time
      return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
    });

    // Return a slice of the top matches to keep the homepage clean
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
