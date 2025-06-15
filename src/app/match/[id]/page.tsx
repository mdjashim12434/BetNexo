
import AppLayout from '@/components/AppLayout';
import type { Match } from '@/components/sports/MatchCard'; // MatchCard's Match type should be compatible
import MatchDetailClientContent from '@/components/match/MatchDetailClientContent';
import { fetchSportsOdds } from '@/services/oddsAPI';
import type { SimplifiedMatchOdds } from '@/types/odds'; // Use the new type

// Mock data can still be used as a fallback or for specific static content
const mockMatches: Match[] = [
    { id: 'static-1', sportKey: 'cricket_static', homeTeam: 'India (Static)', awayTeam: 'Australia (Static)', commenceTime: new Date().toISOString(), sportTitle: 'Cricket', league: 'World Cup Static', homeWinOdds: 1.80, awayWinOdds: 2.10, status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Cricket+Stadium', imageAiHint: 'cricket stadium' },
    { id: 'static-2', sportKey: 'football_static', homeTeam: 'Real Madrid (Static)', awayTeam: 'Barcelona (Static)', commenceTime: new Date(Date.now() + 86400000).toISOString(), sportTitle: 'Football', league: 'La Liga Static', homeWinOdds: 2.20, drawOdds: 3.20, awayWinOdds: 3.00, status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Football+Pitch', imageAiHint: 'football pitch' },
];

// Helper function to transform SimplifiedMatchOdds to Match for display
function transformApiMatchToDisplayMatch(apiMatch: SimplifiedMatchOdds): Match {
  let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
  const commenceDateTime = new Date(apiMatch.commenceTime);
  const now = new Date();
  if (commenceDateTime <= now) {
    status = (apiMatch.homeWinOdds || apiMatch.awayWinOdds || apiMatch.drawOdds || apiMatch.totalsMarket) ? 'live' : 'upcoming'; 
  }

  return {
    id: apiMatch.id,
    sportKey: apiMatch.sportKey,
    homeTeam: apiMatch.homeTeam,
    awayTeam: apiMatch.awayTeam,
    commenceTime: apiMatch.commenceTime,
    sportTitle: apiMatch.sportTitle,
    league: apiMatch.sportTitle, 
    homeWinOdds: apiMatch.homeWinOdds,
    awayWinOdds: apiMatch.awayWinOdds,
    drawOdds: apiMatch.drawOdds,
    totalsMarket: apiMatch.totalsMarket, // Pass totalsMarket
    imageUrl: `https://placehold.co/800x400.png?text=${encodeURIComponent(apiMatch.homeTeam)}+vs+${encodeURIComponent(apiMatch.awayTeam)}`,
    imageAiHint: `${apiMatch.sportTitle.toLowerCase().split('_')[0]} game`,
    status: status,
  };
}

const getMatchDetails = async (id: string, sportKey?: string): Promise<Match | null> => {
  const mockMatch = mockMatches.find(m => m.id === id);
  if (mockMatch) {
    return mockMatch;
  }

  if (sportKey) {
    try {
      console.log(`MatchDetailPage: Fetching odds for sportKey: ${sportKey} to find matchId: ${id}`);
      // Fetch H2H and Totals markets
      const allMatchesForSport = await fetchSportsOdds(sportKey, 'uk', 'h2h,totals'); 
      const apiMatch = allMatchesForSport.find(m => m.id === id);

      if (apiMatch) {
        console.log(`MatchDetailPage: Found API match ${id} in sportKey ${sportKey}. Transforming.`);
        return transformApiMatchToDisplayMatch(apiMatch);
      } else {
        console.warn(`MatchDetailPage: API match ${id} not found in sportKey ${sportKey} results.`);
      }
    } catch (error) {
      console.error(`MatchDetailPage: Error fetching odds for sportKey ${sportKey} to find match ${id}:`, error);
      return null;
    }
  }
  
  return null;
};

export async function generateStaticParams() {
  // Static params for mock matches if any specific paths need to be pre-built
  return mockMatches.map((match) => ({
    id: match.id,
    // sportKey: match.sportKey // if sportKey is part of the path segment
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
          <p className="text-muted-foreground mt-2">This could be due to an invalid link, or the match is no longer available from the API with sportKey: {sportKey || 'N/A'}.</p>
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
