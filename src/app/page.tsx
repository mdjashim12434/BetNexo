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
    const liveFootballFixtures = await fetchLiveFootballFixtures();
    const liveCricketFixtures = await fetchLiveCricketFixtures();
    
    const liveMatches = [...liveFootballFixtures, ...liveCricketFixtures];

    if (liveMatches.length > 0) {
      liveMatches.sort((a,b) => {
        if (a.sportKey === 'football' && b.sportKey === 'cricket') return -1;
        if (a.sportKey === 'cricket' && b.sportKey === 'football') return 1;
        return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
      });
      return { matches: liveMatches, error: null };
    } else {
      const upcomingFootball = await fetchUpcomingFootballFixtures();
      const upcomingCricket = await fetchUpcomingCricketFixtures();
      
      const upcomingFixtures = [...upcomingFootball, ...upcomingCricket]
        .filter(match => match.state?.state === 'NS' || match.state?.state === 'TBA')
        .sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
        
      return { matches: upcomingFixtures, error: null };
    }
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
