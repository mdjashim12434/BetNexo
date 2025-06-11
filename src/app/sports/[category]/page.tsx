
import AppLayout from '@/components/AppLayout';
import type { Match } from '@/components/sports/MatchCard';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';

// Mock data for matches - Opticodds API would provide this
const allMatches: Match[] = [
  { id: '1', teamA: 'India', teamB: 'Australia', time: '14:00 Local', sport: 'Cricket', league: 'World Cup', oddsA: '1.80', oddsB: '2.10', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=Cricket+Match', imageAiHint: 'cricket match' },
  { id: '2', teamA: 'England', teamB: 'South Africa', time: 'LIVE', sport: 'Cricket', league: 'Test Series', oddsA: '2.00', oddsDraw: '3.50', oddsB: '2.50', status: 'live', imageUrl: 'https://placehold.co/600x300.png?text=Live+Cricket', imageAiHint: 'live cricket' },
  { id: '3', teamA: 'Real Madrid', teamB: 'Barcelona', time: 'Tomorrow 19:00 GMT', sport: 'Football', league: 'La Liga', oddsA: '2.20', oddsDraw: '3.20', oddsB: '3.00', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=El+Clasico', imageAiHint: 'football match' },
  { id: '4', teamA: 'Man City', teamB: 'Liverpool', time: 'LIVE', sport: 'Football', league: 'Premier League', oddsA: '1.90', oddsDraw: '3.60', oddsB: '3.80', status: 'live', imageUrl: 'https://placehold.co/600x300.png?text=EPL+Live', imageAiHint: 'live football' },
  { id: '5', teamA: 'Warriors', teamB: 'Lakers', time: 'Today 20:00 PST', sport: 'Basketball', league: 'NBA', oddsA: '1.75', oddsB: '2.15', status: 'upcoming', imageAiHint: 'basketball game' },
  { id: '6', teamA: 'Chennai Super Kings', teamB: 'Mumbai Indians', time: '20 Apr 2024, 18:30', sport: 'Cricket', league: 'IPL', oddsA: '1.95', oddsB: '1.85', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=IPL+Match', imageAiHint: 'cricket ipl' },
  { id: '7', teamA: 'PSG', teamB: 'Bayern Munich', time: 'LIVE', sport: 'Football', league: 'Champions League', oddsA: '2.50', oddsDraw: '3.40', oddsB: '2.70', status: 'live', imageAiHint: 'champions league' },
];

const validCategories = ['live', 'cricket', 'football', 'upcoming', 'all-sports'];
const categoryMapping: { [key: string]: string } = {
  live: 'Live Matches',
  cricket: 'Cricket Matches',
  football: 'Football Matches',
  upcoming: 'Upcoming Matches',
  'all-sports': 'All Sports',
  // 'casino' should not be handled here as it has its own page /casino
};

export async function generateStaticParams() {
  return validCategories.map((category) => ({
    category: category,
  }));
}

interface SportCategoryPageProps {
  params: { category: string };
}

// This is now a Server Component
export default async function SportCategoryPage({ params }: SportCategoryPageProps) {
  const categorySlug = params.category;
  
  if (!validCategories.includes(categorySlug)) {
    // Or handle as a 404, but for static export, this check might be redundant
    // if generateStaticParams is exhaustive and fallback: false (default in App Router for export)
    // For now, let's assume generateStaticParams covers all valid paths.
  }

  const categoryName = categoryMapping[categorySlug] || 'Sports';

  let matchesForCategory: Match[] = [];
  if (categorySlug === 'live') {
    matchesForCategory = allMatches.filter(match => match.status === 'live');
  } else if (categorySlug === 'upcoming') {
    matchesForCategory = allMatches.filter(match => match.status === 'upcoming');
  } else if (categorySlug !== 'all-sports') {
    matchesForCategory = allMatches.filter(match => match.sport.toLowerCase() === categorySlug.replace('-', ' '));
  } else {
    matchesForCategory = allMatches; // 'all-sports'
  }

  const availableSports = ['all', ...new Set(allMatches.map(m => m.sport.toLowerCase()))];

  return (
    <AppLayout>
      <SportsCategoryClientContent
        initialMatches={matchesForCategory}
        categorySlug={categorySlug}
        categoryName={categoryName}
        availableSports={availableSports}
        allMatchesForFiltering={allMatches} // Pass all matches for client-side 'all-sports' filtering if needed
      />
    </AppLayout>
  );
}
