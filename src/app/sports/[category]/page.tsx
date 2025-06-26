
import AppLayout from '@/components/AppLayout';
import type { ProcessedFixture } from '@/types/sportmonks';
import { fetchFootballFixturesByRound, fetchUpcomingCricketFixtures } from '@/services/sportmonksAPI';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';

const validCategories = ['live', 'cricket', 'football', 'upcoming', 'all-sports'];
const categoryMapping: { [key: string]: string } = {
  live: 'Live Matches',
  cricket: 'Cricket Matches',
  football: 'Football Matches',
  upcoming: 'Upcoming Matches',
  'all-sports': 'All Sports',
};

// Example Round ID for EPL, replace with dynamic logic later if needed
const EPL_CURRENT_ROUND_ID = 339273; 

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
    if (categorySlug === 'football' || categorySlug === 'upcoming' || categorySlug === 'all-sports') {
      const rawRoundData = await fetchFootballFixturesByRound(EPL_CURRENT_ROUND_ID);
      if (rawRoundData && rawRoundData.data && rawRoundData.data.fixtures) {
        matchesForCategory = rawRoundData.data.fixtures;
      }
    } else if (categorySlug === 'cricket') {
      matchesForCategory = await fetchUpcomingCricketFixtures();
    }
  } catch (error: any) {
    console.error(`Failed to fetch fixtures for ${categorySlug}:`, error);
    fetchError = error.message || `An unknown error occurred while fetching matches for ${categorySlug}.`;
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
