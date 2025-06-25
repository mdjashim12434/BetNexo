
import AppLayout from '@/components/AppLayout';
import type { ProcessedFixture } from '@/types/sportmonks';
import { fetchFixturesByRound, processFixtureData } from '@/services/sportmonksAPI';
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

  // Only fetch for football for now, other sports will show a "coming soon" message
  if (categorySlug === 'football' || categorySlug === 'upcoming' || categorySlug === 'all-sports') {
      try {
        const rawRoundData = await fetchFixturesByRound(EPL_CURRENT_ROUND_ID);
        // Correctly access the fixtures array inside the nested 'data' object from the API response.
        if (rawRoundData && rawRoundData.data && rawRoundData.data.fixtures) {
            matchesForCategory = processFixtureData(rawRoundData.data.fixtures);
        }
      } catch (error: any) {
          console.error(`Failed to fetch fixtures for ${categorySlug}:`, error);
          fetchError = error.message || "An unknown error occurred while fetching matches.";
          // Keep matchesForCategory empty, the client component will show an error
      }
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
