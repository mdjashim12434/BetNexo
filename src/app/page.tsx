import {
  fetchLiveFootballFixtures,
  fetchUpcomingFootballFixtures,
  fetchLiveCricketFixtures,
  fetchUpcomingCricketFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';
import HomeClientPage from './HomeClientPage';

const isLive = (match: ProcessedFixture): boolean => {
  const liveStates = ['INPLAY', 'Live', '1st Innings', '2nd Innings', 'Innings Break'];
  return !!match.state && liveStates.includes(match.state.state);
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

    // Use a Map to store unique matches by ID, ensuring live matches replace upcoming ones
    const uniqueMatches = new Map<number, ProcessedFixture>();
    
    const allFetchedMatches = [
      ...liveFootball,
      ...liveCricket,
      ...upcomingFootball,
      ...upcomingCricket,
    ];

    allFetchedMatches.forEach(match => {
      const existing = uniqueMatches.get(match.id);
      // Add if not present, or replace if the new one is live and the existing one isn't
      if (!existing || (isLive(match) && !isLive(existing))) {
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
    return { matches: distinctMatches.slice(0, 15), error: null };
    
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
