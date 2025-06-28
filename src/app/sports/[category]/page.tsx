
import AppLayout from '@/components/AppLayout';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';

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

// This is now a simple server component that does not fetch match data.
// It passes fetching parameters to the client component, which handles loading.
export default async function SportCategoryPage({ params, searchParams }: SportCategoryPageProps) {
  const categorySlug = params.category;
  const categoryName = categoryMapping[categorySlug] || 'Sports';
  const leagueId = searchParams.leagueId as string | undefined;
  
  return (
    <AppLayout>
      <div className="container py-6">
        <SportsCategoryClientContent
          categorySlug={categorySlug}
          categoryName={categoryName}
          leagueId={leagueId}
        />
      </div>
    </AppLayout>
  );
}
