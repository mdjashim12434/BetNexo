
import AppLayout from '@/components/AppLayout';
import SportsCategoryClientContent from '@/components/sports/SportsCategoryClientContent';
import { fetchLiveFootballFixtures, fetchUpcomingFootballFixtures } from '@/services/sportmonksAPI';
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

interface SportCategoryPageProps {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getMatchesForCategory(categorySlug: string, leagueId?: number) {
    if (categorySlug === 'all-sports') {
        return { liveMatches: [], upcomingMatches: [], error: null };
    }

    let liveMatches: ProcessedFixture[] = [];
    let upcomingMatches: ProcessedFixture[] = [];
    let error: string | null = null;
    const errorMessages: string[] = [];
    
    const promisesToRun: Promise<ProcessedFixture[]>[] = [];
    
    if (categorySlug === 'live' || categorySlug === 'football') {
        promisesToRun.push(fetchLiveFootballFixtures(leagueId));
    }
    
    if (categorySlug === 'upcoming' || categorySlug === 'football') {
        promisesToRun.push(fetchUpcomingFootballFixtures(leagueId));
    }

    // Ensure we always have two promises for Promise.allSettled
    while (promisesToRun.length < 2) {
        promisesToRun.push(Promise.resolve([]));
    }
    
    const [liveResult, upcomingResult] = await Promise.allSettled(promisesToRun);

    if (liveResult.status === 'fulfilled') {
        liveMatches = liveResult.value;
    } else {
        const reason = (liveResult.reason as Error).message || "Could not fetch live matches.";
        errorMessages.push(`Error fetching live matches: ${reason}`);
    }

    if (upcomingResult.status === 'fulfilled') {
        const upcomingData = upcomingResult.value;
        const liveMatchIds = new Set(liveMatches.map(m => m.id));
        upcomingMatches = upcomingData.filter(m => !liveMatchIds.has(m.id));
    } else {
        const reason = (upcomingResult.reason as Error).message || "Could not fetch upcoming matches.";
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
  
  const { liveMatches, upcomingMatches, error } = await getMatchesForCategory(categorySlug, leagueId);
  
  return (
    <AppLayout>
      <div className="container py-6">
        <SportsCategoryClientContent
          categorySlug={categorySlug}
          categoryName={categoryName}
          leagueId={searchParams.leagueId as string | undefined}
          initialLiveMatches={liveMatches}
          initialUpcomingMatches={upcomingMatches}
          initialError={error}
        />
      </div>
    </AppLayout>
  );
}
