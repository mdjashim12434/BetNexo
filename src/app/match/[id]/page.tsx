
import AppLayout from '@/components/AppLayout';
import type { Match } from '@/components/sports/MatchCard';
import MatchDetailClientContent from '@/components/match/MatchDetailClientContent';
import { fetchSportsOdds, type SimplifiedMatchOdds } from '@/services/oddsAPI'; // Import fetchSportsOdds and its type

// Mock data for matches - for any static content or fallback
const mockMatches: Match[] = [
    { id: 'static-1', teamA: 'India (Static)', teamB: 'Australia (Static)', time: '14:00 Local', sport: 'Cricket', league: 'World Cup Static', oddsA: '1.80', oddsB: '2.10', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Cricket+Stadium', imageAiHint: 'cricket stadium' },
    { id: 'static-2', teamA: 'Real Madrid (Static)', teamB: 'Barcelona (Static)', time: 'Tomorrow 19:00 GMT', sport: 'Football', league: 'La Liga Static', oddsA: '2.20', oddsDraw: '3.20', oddsB: '3.00', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Football+Pitch', imageAiHint: 'football pitch' },
];

// Helper function to transform SimplifiedMatchOddsOutput to Match
function transformApiMatchToDisplayMatch(apiMatch: SimplifiedMatchOdds): Match {
  let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
  const commenceDateTime = new Date(apiMatch.commenceTime);
  const now = new Date();
  if (commenceDateTime <= now) {
    // This is a rough estimation. True live/finished status would ideally come from API.
    // If odds are present, assume live, otherwise could be finished or pre-match without odds yet.
    status = (apiMatch.homeWinOdds || apiMatch.awayWinOdds || apiMatch.drawOdds) ? 'live' : 'upcoming'; 
  }

  return {
    id: apiMatch.id,
    teamA: apiMatch.homeTeam,
    teamB: apiMatch.awayTeam,
    time: apiMatch.commenceTime, // MatchDetailClientContent will format this
    sport: apiMatch.sportTitle,
    league: apiMatch.sportTitle, // Or a more specific league if available
    oddsA: apiMatch.homeWinOdds?.toString(),
    oddsB: apiMatch.awayWinOdds?.toString(),
    oddsDraw: apiMatch.drawOdds?.toString(),
    imageUrl: `https://placehold.co/800x400.png?text=${encodeURIComponent(apiMatch.homeTeam)}+vs+${encodeURIComponent(apiMatch.awayTeam)}`,
    imageAiHint: `${apiMatch.sportTitle.toLowerCase().split('_')[0]} game`, // e.g. "cricket game"
    status: status,
  };
}


const getMatchDetails = async (id: string, sportKey?: string): Promise<Match | null> => {
  // 1. Try to find in mockMatches first (for static content)
  const mockMatch = mockMatches.find(m => m.id === id);
  if (mockMatch) {
    return mockMatch;
  }

  // 2. If not in mocks and sportKey is provided, try to fetch from API
  if (sportKey) {
    try {
      console.log(`MatchDetailPage: Fetching odds for sportKey: ${sportKey} to find matchId: ${id}`);
      // region and markets could also be passed via searchParams if they vary
      const allMatchesForSport = await fetchSportsOdds(sportKey, 'uk', 'h2h');
      const apiMatch = allMatchesForSport.find(m => m.id === id);

      if (apiMatch) {
        console.log(`MatchDetailPage: Found API match ${id} in sportKey ${sportKey}. Transforming.`);
        return transformApiMatchToDisplayMatch(apiMatch);
      } else {
        console.warn(`MatchDetailPage: API match ${id} not found in sportKey ${sportKey} results.`);
      }
    } catch (error) {
      console.error(`MatchDetailPage: Error fetching odds for sportKey ${sportKey} to find match ${id}:`, error);
      // Optionally, you could throw the error or return a specific error state
      return null;
    }
  }
  
  // 3. If not found anywhere
  return null;
};

// generateStaticParams can still be used for mockMatches if you want to pre-build those
export async function generateStaticParams() {
  return mockMatches.map((match) => ({
    id: match.id,
  }));
}

interface MatchDetailPageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function MatchDetailPage({ params, searchParams }: MatchDetailPageProps) {
  const matchId = params.id;
  const sportKey = searchParams?.sportKey as string | undefined;

  console.log(`MatchDetailPage: Received matchId: ${matchId}, sportKey: ${sportKey}`);
  const match = await getMatchDetails(matchId, sportKey);

  if (!match) {
    return (
      <AppLayout>
        <div className="text-center p-10">
          <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
          <p className="text-muted-foreground">Could not find details for match ID: {matchId}.</p>
          <p className="text-muted-foreground mt-2">If this was a live match, it might no longer be available or the link may be incorrect.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <MatchDetailClientContent initialMatch={match} />
    </AppLayout>
  );
}
