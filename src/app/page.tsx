import {
  fetchLiveFootballFixtures,
  fetchUpcomingFootballFixtures,
  fetchLiveCricketFixtures,
  fetchUpcomingCricketFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';
import HomeClientPage from './HomeClientPage';

const isLive = (match: ProcessedFixture): boolean => {
  if (!match?.state) return false;
  // A more comprehensive list of states that are considered "live"
  const liveStates = [
    'INPLAY',      // Football
    'HT',          // Football - Half-Time
    'ET',          // Football - Extra Time
    'PEN_LIVE',    // Football - Penalties
    'BREAK',       // General break state
    'Live',        // Cricket
    '1st Innings', // Cricket
    '2nd Innings', // Cricket
    'Innings Break',// Cricket
    'Super Over',  // Cricket
    'TOSS',        // Cricket - just before start
    'DELAYED',     // Match is live but delayed
  ];
  return liveStates.includes(match.state.state);
}

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

    // Combine all matches, with live matches coming last to ensure they overwrite upcoming ones.
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

    // Sort the combined list: live matches first, then by start time
    distinctMatches.sort((a, b) => {
      const aIsLive = isLive(a);
      const bIsLive = isLive(b);

      if (aIsLive && !bIsLive) return -1; // a (live) comes before b (not live)
      if (!aIsLive && bIsLive) return 1;  // b (live) comes before a (not live)

      // If both are live or both are upcoming, sort by start time
      return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
    });

    // Return a slice of the top matches to keep the homepage clean
    return { matches: distinctMatches.slice(0, 20), error: null };
    
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
