
import AppLayout from '@/components/AppLayout';
import type { ProcessedFixture } from '@/types/sportmonks';
import {
  fetchUpcomingFootballFixtures,
  fetchUpcomingCricketFixtures,
  fetchLiveFootballFixtures,
  fetchLiveCricketFixtures,
} from '@/services/sportmonksAPI';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';

const validCategories = ['live', 'cricket', 'football', 'upcoming', 'all-sports'];
const categoryMapping: { [key: string]: string } = {
  live: 'Live Matches',
  cricket: 'Cricket Matches',
  football: 'Football Matches',
  upcoming: 'Upcoming Matches',
  'all-sports': 'All Sports',
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

  try {
    if (categorySlug === 'live') {
      const [footballMatches, cricketMatches] = await Promise.all([
        fetchLiveFootballFixtures().catch((e) => {
          console.error('Failed to fetch live football fixtures:', e.message);
          return []; // Return empty array on failure to not break Promise.all
        }),
        fetchLiveCricketFixtures().catch((e) => {
          console.error('Failed to fetch live cricket fixtures:', e.message);
          return []; // Return empty array on failure
        }),
      ]);
      matchesForCategory = [...footballMatches, ...cricketMatches];
    } else if (
      categorySlug === 'football' ||
      categorySlug === 'upcoming' ||
      categorySlug === 'all-sports'
    ) {
      matchesForCategory = await fetchUpcomingFootballFixtures();
    } else if (categorySlug === 'cricket') {
      matchesForCategory = await fetchUpcomingCricketFixtures();
    }
  } catch (error: any) {
    console.error(`Failed to fetch fixtures for ${categorySlug}:`, error);
    fetchError =
      error.message ||
      `An unknown error occurred while fetching matches for ${categorySlug}.`;
  }

  // Pass all fetched matches for client-side filtering if needed
  const allMatchesForFiltering = matchesForCategory;

  return (
    <AppLayout>
      <SportsCategoryClientContent
        initialMatches={matchesForCategory}
        categorySlug={categorySlug}
        categoryName={categoryName}
        allMatchesForFiltering={allMatchesForFiltering}
        error={fetchError}
      />
    </AppLayout>
  );
}
