
import AppLayout from '@/components/AppLayout';
import type { ProcessedFixture } from '@/types/sportmonks';
import {
  fetchUpcomingFootballFixtures,
  fetchUpcomingCricketFixtures,
  fetchLiveFootballFixtures,
} from '@/services/sportmonksAPI';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';

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
}

// This is a Server Component
export default async function SportCategoryPage({ params }: SportCategoryPageProps) {
  const categorySlug = params.category;
  const categoryName = categoryMapping[categorySlug] || 'Sports';

  let matchesForCategory: ProcessedFixture[] = [];
  let fetchError: string | null = null;
  const errorMessages: string[] = [];

  const handleFetchError = (sport: string, type: string, e: any) => {
    const message = e.message || `Unknown error fetching ${type} ${sport} fixtures.`;
    console.error(`Failed to fetch ${type} ${sport} fixtures:`, message);
    errorMessages.push(`Could not load ${type} ${sport} matches.`);
    return []; // Return empty array on failure to not break Promise.all
  };

  // For 'all-sports', we don't fetch matches on the server.
  // The client component will fetch the leagues.
  if (categorySlug !== 'all-sports') {
    try {
      if (categorySlug === 'live') {
        // Only fetch live football as live cricket is not supported by the current API plan
        const [footballMatches] = await Promise.all([
          fetchLiveFootballFixtures().catch((e) => handleFetchError('football', 'live', e)),
        ]);
        matchesForCategory = [...footballMatches];
      } else if (categorySlug === 'football') {
        const [liveMatches, upcomingMatches] = await Promise.all([
          fetchLiveFootballFixtures().catch((e) => handleFetchError('football', 'live', e)),
          fetchUpcomingFootballFixtures().catch((e) => handleFetchError('football', 'upcoming', e)),
        ]);
        matchesForCategory = [...liveMatches, ...upcomingMatches];
      } else if (categorySlug === 'cricket') {
        // Only fetch upcoming cricket as live cricket is not supported by the API plan
        const [upcomingMatches] = await Promise.all([
          fetchUpcomingCricketFixtures().catch((e) => handleFetchError('cricket', 'upcoming', e)),
        ]);
        matchesForCategory = [...upcomingMatches];
      } else if (categorySlug === 'upcoming') {
        const [footballMatches, cricketMatches] = await Promise.all([
          fetchUpcomingFootballFixtures().catch((e) => handleFetchError('football', 'upcoming', e)),
          fetchUpcomingCricketFixtures().catch((e) => handleFetchError('cricket', 'upcoming', e)),
        ]);
        matchesForCategory = [...footballMatches, ...cricketMatches];
      }
    } catch (error: any) {
      console.error(`A top-level error occurred while fetching fixtures for ${categorySlug}:`, error);
      fetchError = error.message || `An unknown error occurred while fetching matches for ${categorySlug}.`;
    }
  }


  // Combine any individual fetch errors into one message
  if (errorMessages.length > 0) {
    fetchError = (fetchError ? fetchError + '\n' : '') + errorMessages.join('\n');
  }

  // Sort matches to show live ones first
  matchesForCategory.sort((a, b) => {
    const aIsLive = a.state?.state === 'INPLAY' || a.state?.state === 'Live';
    const bIsLive = b.state?.state === 'INPLAY' || b.state?.state === 'Live';

    if (aIsLive && !bIsLive) return -1; // a comes first
    if (!aIsLive && bIsLive) return 1;  // b comes first

    // If both are live or both are not, sort by start time (soonest first)
    return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
  });

  return (
    <AppLayout>
      <div className="container py-6">
        <SportsCategoryClientContent
          initialMatches={matchesForCategory}
          categorySlug={categorySlug}
          categoryName={categoryName}
          error={fetchError}
        />
      </div>
    </AppLayout>
  );
}
