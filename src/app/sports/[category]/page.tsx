
import AppLayout from '@/components/AppLayout';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';
import {
  fetchUpcomingFootballFixtures,
  fetchUpcomingCricketFixtures,
  fetchLiveFootballFixtures,
  fetchLiveCricketFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';

const validCategories = ['live', 'cricket', 'football', 'upcoming', 'all-sports'];
const categoryMapping: { [key: string]: string } = {
  live: 'Live Matches',
  cricket: 'Cricket',
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
  let matchesForCategory: ProcessedFixture[] = [];
  const errorMessages: string[] = [];

  const handleFetchError = (sport: string, type: string, e: any) => {
    const message = e.message || `Unknown error fetching ${type} ${sport} fixtures.`;
    console.error(`Failed to fetch ${type} ${sport} fixtures:`, message);
    errorMessages.push(`Could not load ${type} ${sport} matches.`);
    return [];
  };

  try {
    if (categorySlug === 'live') {
      const [footballMatches] = await Promise.all([
        fetchLiveFootballFixtures(leagueId).catch((e) => handleFetchError('football', 'live', e)),
      ]);
      matchesForCategory = [...footballMatches];
    } else if (categorySlug === 'football') {
      const [liveMatches, upcomingMatches] = await Promise.all([
        fetchLiveFootballFixtures(leagueId).catch((e) => handleFetchError('football', 'live', e)),
        fetchUpcomingFootballFixtures(leagueId).catch((e) => handleFetchError('football', 'upcoming', e)),
      ]);
      matchesForCategory = [...liveMatches, ...upcomingMatches];
    } else if (categorySlug === 'cricket') {
      const [upcomingMatches] = await Promise.all([
        fetchUpcomingCricketFixtures(leagueId).catch((e) => handleFetchError('cricket', 'upcoming', e)),
      ]);
      matchesForCategory = [...upcomingMatches];
    } else if (categorySlug === 'upcoming') {
      const [footballMatches, cricketMatches] = await Promise.all([
        fetchUpcomingFootballFixtures(leagueId).catch((e) => handleFetchError('football', 'upcoming', e)),
        fetchUpcomingCricketFixtures(leagueId).catch((e) => handleFetchError('cricket', 'upcoming', e)),
      ]);
      matchesForCategory = [...footballMatches, ...cricketMatches];
    }

    matchesForCategory.sort((a, b) => {
      const aIsLive = a.state?.state === 'INPLAY' || a.state?.state === 'Live';
      const bIsLive = b.state?.state === 'INPLAY' || b.state?.state === 'Live';
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
    });

    return { matches: matchesForCategory, error: errorMessages.length > 0 ? errorMessages.join('\n') : null };
  } catch (error: any) {
    console.error(`A top-level error occurred while fetching fixtures for ${categorySlug}:`, error);
    return { matches: [], error: error.message || `An unknown error occurred while fetching matches for ${categorySlug}.` };
  }
}

// This is a Server Component that fetches data and passes it to the client component.
export default async function SportCategoryPage({ params, searchParams }: SportCategoryPageProps) {
  const categorySlug = params.category;
  const categoryName = categoryMapping[categorySlug] || 'Sports';
  const leagueIdParam = searchParams.leagueId;
  const leagueId = leagueIdParam && typeof leagueIdParam === 'string' ? Number(leagueIdParam) : undefined;
  
  const { matches, error } = await getMatchesForCategory(categorySlug, leagueId);

  return (
    <AppLayout>
      <div className="container py-6">
        <SportsCategoryClientContent
          categorySlug={categorySlug}
          categoryName={categoryName}
          initialMatches={matches}
          initialError={error}
          leagueId={leagueIdParam as string | undefined}
        />
      </div>
    </AppLayout>
  );
}
