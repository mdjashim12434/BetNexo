import {
  fetchFootballLiveScores,
  fetchUpcomingFootballFixtures,
} from '@/services/sportmonksAPI';
import type {
  ProcessedFootballLiveScore,
  ProcessedFixture,
} from '@/types/sportmonks';
import HomeClientPage from './HomeClientPage';

async function getHomePageMatches() {
  try {
    const liveMatches = await fetchFootballLiveScores();

    if (liveMatches.length > 0) {
      return { liveMatches, upcomingFixtures: [], error: null };
    } else {
      const upcomingFixtures = await fetchUpcomingFootballFixtures();
      // Filter for matches that have not started yet
      const trulyUpcoming = upcomingFixtures.filter(
        (match) => match.state?.state === 'NS' || match.state?.state === 'TBA'
      );
      // Sort upcoming matches by starting time
      const sortedUpcoming = trulyUpcoming.sort(
        (a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime()
      );
      return { liveMatches: [], upcomingFixtures: sortedUpcoming, error: null };
    }
  } catch (error) {
    console.error('Error fetching matches for home page:', error);
    return {
      liveMatches: [],
      upcomingFixtures: [],
      error:
        (error as Error).message ||
        'An unknown error occurred while fetching matches.',
    };
  }
}

export default async function HomePage() {
  const { liveMatches, upcomingFixtures, error } = await getHomePageMatches();

  return (
    <HomeClientPage
      initialLiveMatches={liveMatches}
      initialUpcomingFixtures={upcomingFixtures}
      initialError={error}
    />
  );
}
