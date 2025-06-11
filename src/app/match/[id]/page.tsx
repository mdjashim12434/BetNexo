
import AppLayout from '@/components/AppLayout';
import type { Match } from '@/components/sports/MatchCard';
import MatchDetailClientContent from '@/components/match/MatchDetailClientContent'; // New client component

// Mock data for matches - In a real app, fetch from an API if not static
const mockMatches: Match[] = [
    { id: '1', teamA: 'India', teamB: 'Australia', time: '14:00 Local', sport: 'Cricket', league: 'World Cup', oddsA: '1.80', oddsB: '2.10', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Cricket+Stadium', imageAiHint: 'cricket stadium' },
    { id: '2', teamA: 'England', teamB: 'South Africa', time: 'LIVE', sport: 'Cricket', league: 'Test Series', oddsA: '2.00', oddsDraw: '3.50', oddsB: '2.50', status: 'live', imageUrl: 'https://placehold.co/800x400.png?text=Live+Cricket+Action', imageAiHint: 'live cricket' },
    { id: '3', teamA: 'Real Madrid', teamB: 'Barcelona', time: 'Tomorrow 19:00 GMT', sport: 'Football', league: 'La Liga', oddsA: '2.20', oddsDraw: '3.20', oddsB: '3.00', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Football+Pitch', imageAiHint: 'football pitch' },
    { id: '4', teamA: 'Man City', teamB: 'Liverpool', time: 'LIVE', sport: 'Football', league: 'Premier League', oddsA: '1.90', oddsDraw: '3.60', oddsB: '3.80', status: 'live', imageUrl: 'https://placehold.co/800x400.png?text=Live+Football+Action', imageAiHint: 'live football' },
    { id: '5', teamA: 'Warriors', teamB: 'Lakers', time: 'Today 20:00 PST', sport: 'Basketball', league: 'NBA', oddsA: '1.75', oddsB: '2.15', status: 'upcoming', imageAiHint: 'basketball game' },
    { id: '6', teamA: 'Chennai Super Kings', teamB: 'Mumbai Indians', time: '20 Apr 2024, 18:30', sport: 'Cricket', league: 'IPL', oddsA: '1.95', oddsB: '1.85', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=IPL+Match', imageAiHint: 'cricket ipl' },
    { id: '7', teamA: 'PSG', teamB: 'Bayern Munich', time: 'LIVE', sport: 'Football', league: 'Champions League', oddsA: '2.50', oddsDraw: '3.40', oddsB: '2.70', status: 'live', imageAiHint: 'champions league' },
];

const getMatchDetails = async (id: string): Promise<Match | null> => {
  // In a real app, fetch this from an API
  return mockMatches.find(m => m.id === id) || null;
};

export async function generateStaticParams() {
  return mockMatches.map((match) => ({
    id: match.id,
  }));
}

interface MatchDetailPageProps {
  params: { id: string };
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const matchId = params.id;
  const match = await getMatchDetails(matchId);

  if (!match) {
    return (
      <AppLayout>
        <div className="text-center p-10">Match not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <MatchDetailClientContent initialMatch={match} />
    </AppLayout>
  );
}
