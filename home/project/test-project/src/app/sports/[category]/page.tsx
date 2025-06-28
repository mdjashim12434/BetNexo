
import AppLayout from '@/components/AppLayout';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';
import { getLiveScoresFromServer, getUpcomingFixturesFromServer, getFootballLeaguesFromServer } from '@/lib/sportmonks-server';
import { processV3FootballFixtures } from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';

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

interface ApiLeague {
  id: number;
  name: string;
}

interface CombinedLeague {
  id: number;
  name: string;
  sport: 'football';
}

interface SportCategoryPageProps {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getLeaguesForPage(): Promise<{ leagues: CombinedLeague[], error: string | null }> {
  try {
    const footballLeaguesRaw = await getFootballLeaguesFromServer();
    const footballLeagues: CombinedLeague[] = (footballLeaguesRaw || []).map((l: ApiLeague) => ({
      id: l.id,
      name: l.name,
      sport: 'football' as const
    }));
    
    footballLeagues.sort((a, b) => a.name.localeCompare(b.name));
    return { leagues: footballLeagues, error: null };
  } catch (error: any) {
    console.error("Error fetching leagues on server:", error);
    return { leagues: [], error: error.message || "Failed to fetch leagues." };
  }
}


async function getMatchesForCategory(categorySlug: string, leagueId?: number) {
    if (categorySlug === 'all-sports') {
        return { liveMatches: [], upcomingMatches: [], error: null };
    }

    let liveMatches: ProcessedFixture[] = [];
    let upcomingMatches: ProcessedFixture[] = [];
    let error: string | null = null;
    const errorMessages: string[] = [];
    
    const shouldFetchLive = categorySlug === 'live' || categorySlug === 'football';
    const shouldFetchUpcoming = categorySlug === 'upcoming' || categorySlug === 'football';

    const livePromise = shouldFetchLive 
      ? getLiveScoresFromServer(leagueId).then(processV3FootballFixtures) 
      : Promise.resolve([]);
      
    const upcomingPromise = shouldFetchUpcoming 
      ? getUpcomingFixturesFromServer(leagueId).then(processV3FootballFixtures) 
      : Promise.resolve([]);
    
    const [liveResult, upcomingResult] = await Promise.allSettled([livePromise, upcomingPromise]);

    if (liveResult.status === 'fulfilled') {
        liveMatches = liveResult.value.filter(m => !m.isFinished);
    } else if(shouldFetchLive) {
        const reason = (liveResult.reason as Error).message || "Could not fetch live matches.";
        console.error(`Error fetching live matches for category '${categorySlug}':`, reason);
        errorMessages.push(`Error fetching live matches: ${reason}`);
    }

    if (upcomingResult.status === 'fulfilled') {
        const liveMatchIds = new Set(liveMatches.map(m => m.id));
        const now = new Date();
        upcomingMatches = upcomingResult.value.filter(m => !liveMatchIds.has(m.id) && new Date(m.startingAt) > now);
    } else if(shouldFetchUpcoming) {
        const reason = (upcomingResult.reason as Error).message || "Could not fetch upcoming matches.";
        console.error(`Error fetching upcoming matches for category '${categorySlug}':`, reason);
        errorMessages.push(`Error fetching upcoming matches: ${reason}`);
    }

    if (errorMessages.length > 0) {
        error = errorMessages.join('\n\n');
    }

    liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
    upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

    return { liveMatches, upcomingMatches, error };
}


export default async function SportCategoryPage({ params, searchParams }: SportCategoryPageProps) {
  const categorySlug = params.category;
  const categoryName = categoryMapping[categorySlug] || 'Sports';
  const leagueId = searchParams.leagueId ? Number(searchParams.leagueId) : undefined;
  
  const { liveMatches, upcomingMatches, error: matchesError } = await getMatchesForCategory(categorySlug, leagueId);
  const { leagues, error: leaguesError } = categorySlug === 'all-sports' ? await getLeaguesForPage() : { leagues: [], error: null };

  const combinedError = [matchesError, leaguesError].filter(Boolean).join('\n') || null;
  
  return (
    <AppLayout>
      <div className="container py-6">
        <SportsCategoryClientContent
          categorySlug={categorySlug}
          categoryName={categoryName}
          leagueId={searchParams.leagueId as string | undefined}
          initialLiveMatches={liveMatches}
          initialUpcomingMatches={upcomingMatches}
          initialLeagues={leagues}
          initialError={combinedError}
        />
      </div>
    </AppLayout>
  );
}
