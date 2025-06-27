
import AppLayout from '@/components/AppLayout';
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

// This page now simply sets up the layout and passes parameters to the client component.
// All data fetching is handled on the client-side for a faster initial page load.
export default function SportCategoryPage({ params }: SportCategoryPageProps) {
  const categorySlug = params.category;
  const categoryName = categoryMapping[categorySlug] || 'Sports';

  return (
    <AppLayout>
      <div className="container py-6">
        <SportsCategoryClientContent
          categorySlug={categorySlug}
          categoryName={categoryName}
        />
      </div>
    </AppLayout>
  );
}
