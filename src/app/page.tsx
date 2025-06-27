
import {
  fetchLiveFootballFixtures,
  fetchTodaysFootballFixtures,
  fetchLiveCricketFixtures,
  fetchUpcomingCricketFixtures,
} from '@/services/sportmonksAPI';
import HomeClientPage from './HomeClientPage';
import type { ProcessedFixture } from '@/types/sportmonks';

async function getHomePageMatches() {
  // Fetch all data in parallel, using the new reliable 'todays-fixtures' endpoint
  const [
    liveFootballResult, 
    todaysFootballResult,
    liveCricketResult,
    upcomingCricketResult
  ] = await Promise.allSettled([
    fetchLiveFootballFixtures(),
    fetchTodaysFootballFixtures(), // Use the new reliable endpoint
    fetchLiveCricketFixtures(),
    fetchUpcomingCricketFixtures(undefined, true),
  ]);

  let errorMessages: string[] = [];
  
  // Combine all live matches (football and cricket)
  let liveMatches: ProcessedFixture[] = [];
  if (liveFootballResult.status === 'fulfilled') {
    liveMatches = liveMatches.concat(liveFootballResult.value);
  } else {
    console.error("Home page: Failed to fetch live football matches:", liveFootballResult.reason);
    errorMessages.push(liveFootballResult.reason?.message || 'Could not fetch live football matches.');
  }
  if (liveCricketResult.status === 'fulfilled') {
    liveMatches = liveMatches.concat(liveCricketResult.value);
  } else {
    console.error("Home page: Failed to fetch live cricket matches:", liveCricketResult.reason);
    errorMessages.push(liveCricketResult.reason?.message || 'Could not fetch live cricket matches.');
  }

  // Process today's and upcoming matches
  let upcomingMatches: ProcessedFixture[] = [];
   if (todaysFootballResult.status === 'fulfilled') {
    // From all of today's matches, filter only those that are not live and not finished.
    const todaysUpcoming = todaysFootballResult.value.filter(match => !match.isFinished && !match.isLive);
    upcomingMatches = upcomingMatches.concat(todaysUpcoming);
  } else {
    console.error("Home page: Failed to fetch today's football matches:", todaysFootballResult.reason);
    errorMessages.push(todaysFootballResult.reason?.message || 'Could not fetch today\'s football matches.');
  }
  if (upcomingCricketResult.status === 'fulfilled') {
    upcomingMatches = upcomingMatches.concat(upcomingCricketResult.value);
  } else {
    console.error("Home page: Failed to fetch upcoming cricket matches:", upcomingCricketResult.reason);
    errorMessages.push(upcomingCricketResult.reason?.message || 'Could not fetch upcoming cricket matches.');
  }

  // De-duplicate: If a match is live, it must not appear in the upcoming list.
  const liveMatchIds = new Set(liveMatches.map(m => m.id));
  const uniqueUpcomingMatches = upcomingMatches.filter(match => !liveMatchIds.has(match.id));
  
  // Sort both lists by their starting time for a consistent order.
  liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
  uniqueUpcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

  const finalError = errorMessages.length > 0 ? errorMessages.join(' ') : null;

  // Return the processed, separated, and sliced arrays for the home page.
  return { 
    liveMatches: liveMatches.slice(0, 10), 
    upcomingMatches: uniqueUpcomingMatches.slice(0, 10), 
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
