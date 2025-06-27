
import AppLayout from '@/components/AppLayout';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';
import {
  fetchUpcomingFootballFixtures,
  fetchLiveFootballFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';

const validCategories = ['live', 'football', 'upcoming', 'all-sports'];
const categoryMapping: { [key: string]: string } = {
  live: 'Live Matches',
  football: 'Football',
  upcoming: 'Upcoming Matches',
  'all-sports': 'All Sports Leagues',
};

export async function generateStaticParams() {
  return validCategories.map((category) => ({
    category: category,
  }));
}

interface SportCategoryPageProps {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getMatchesForCategory(categorySlug: string, leagueId?: number) {
  let liveMatchesPromise: Promise<ProcessedFixture[]> = Promise.resolve([]);
  let upcomingMatchesPromise: Promise<ProcessedFixture[]> = Promise.resolve([]);
  const errorMessages: string[] = [];

  const handleFetch = <T,>(promise: Promise<T>): Promise<T | []> =>
    promise.catch(e => {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`Error in getMatchesForCategory for ${categorySlug}:`, message);
        errorMessages.push(message);
        return [];
    });

  if (categorySlug === 'live') {
    liveMatchesPromise = handleFetch(fetchLiveFootballFixtures(leagueId));
    upcomingMatchesPromise = Promise.resolve([]);

  } else if (categorySlug === 'football') {
    liveMatchesPromise = handleFetch(fetchLiveFootballFixtures(leagueId));
    upcomingMatchesPromise = handleFetch(fetchUpcomingFootballFixtures(leagueId));

  } else if (categorySlug === 'upcoming') {
     // No live matches for the 'upcoming' page
    liveMatchesPromise = Promise.resolve([]);
    upcomingMatchesPromise = handleFetch(fetchUpcomingFootballFixtures(leagueId));
  }

  const [liveMatches, upcomingMatchesUnfiltered] = await Promise.all([
    liveMatchesPromise,
    upcomingMatchesPromise
  ]);

  // Ensure no duplicates: if a match is live, it shouldn't be in upcoming.
  const liveMatchIds = new Set(liveMatches.map(m => m.id));
  const upcomingMatches = upcomingMatchesUnfiltered.filter(m => !liveMatchIds.has(m.id));

  // Sort each list individually
  liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
  upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

  return { 
    liveMatches, 
    upcomingMatches, 
    error: errorMessages.length > 0 ? errorMessages.join('\n') : null 
  };
}


// This is a Server Component that fetches data and passes it to the client component.
export default async function SportCategoryPage({ params, searchParams }: SportCategoryPageProps) {
  const categorySlug = params.category;
  const categoryName = categoryMapping[categorySlug] || 'Sports';
  const leagueIdParam = searchParams.leagueId;
  const leagueId = leagueIdParam && typeof leagueIdParam === 'string' ? Number(leagueIdParam) : undefined;
  
  const { liveMatches, upcomingMatches, error } = await getMatchesForCategory(categorySlug, leagueId);

  return (
    <AppLayout>
      <div className="container py-6">
        <SportsCategoryClientContent
          categorySlug={categorySlug}
          categoryName={categoryName}
          initialLiveMatches={liveMatches}
          initialUpcomingMatches={upcomingMatches}
          initialError={error}
          leagueId={leagueIdParam as string | undefined}
        />
      </div>
    </AppLayout>
  );
}
