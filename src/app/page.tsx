
import {
  fetchLiveFootballFixtures,
  fetchUpcomingFootballFixtures,
} from '@/services/sportmonksAPI';
import HomeClientPage from './HomeClientPage';
import type { ProcessedFixture } from '@/types/sportmonks';

async function getHomePageMatches() {
  const [liveResult, upcomingResult] = await Promise.allSettled([
    fetchLiveFootballFixtures(),
    fetchUpcomingFootballFixtures(),
  ]);

  let errorMessages: string[] = [];
  let liveMatches: ProcessedFixture[] = [];
  let upcomingMatches: ProcessedFixture[] = [];

  if (liveResult.status === 'fulfilled') {
    liveMatches = liveResult.value;
  } else {
    console.error("Home page: Failed to fetch live matches:", liveResult.reason);
    errorMessages.push(liveResult.reason?.message || 'Could not fetch live matches.');
  }

  if (upcomingResult.status === 'fulfilled') {
    // Filter out any upcoming matches that might have just gone live and are in the live list
    const liveMatchIds = new Set(liveMatches.map(m => m.id));
    upcomingMatches = upcomingResult.value.filter(match => !liveMatchIds.has(match.id));
  } else {
    console.error("Home page: Failed to fetch upcoming matches:", upcomingResult.reason);
    errorMessages.push(upcomingResult.reason?.message || 'Could not fetch upcoming matches.');
  }

  const finalError = errorMessages.length > 0 ? errorMessages.join(' ') : null;

  // Return separate arrays, sliced to a reasonable number for the home page.
  return { 
    liveMatches: liveMatches.slice(0, 10), 
    upcomingMatches: upcomingMatches.slice(0, 10), 
    error: finalError 
  };
}


export default async function HomePage() {
  const { liveMatches, upcomingMatches, error } = await getHomePageMatches();

  return (
    <HomeClientPage
      initialLiveMatches={liveMatches}
      initialUpcomingMatches={upcomingMatches}
      initialError={error}
    />
  );
}
