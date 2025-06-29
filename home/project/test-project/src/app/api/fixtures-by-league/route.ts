import { NextResponse, type NextRequest } from 'next/server';
import { getUpcomingFixturesFromServer, getLiveScoresFromServer } from '@/lib/sportmonks-server';
import { processV3FootballFixtures } from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league_id");

  if (!leagueId) {
    return NextResponse.json({ error: 'league_id parameter is required.' }, { status: 400 });
  }

  try {
    const liveMatchesPromise: Promise<ProcessedFixture[]> = getLiveScoresFromServer(Number(leagueId)).then(processV3FootballFixtures);
    const upcomingMatchesPromise: Promise<ProcessedFixture[]> = getUpcomingFixturesFromServer(Number(leagueId)).then(processV3FootballFixtures);
    
    const [liveResult, upcomingResult] = await Promise.allSettled([liveMatchesPromise, upcomingMatchesPromise]);

    const liveMatches = liveResult.status === 'fulfilled' ? liveResult.value : [];
    const upcomingMatches = upcomingResult.status === 'fulfilled' ? upcomingResult.value : [];
    
    const liveMatchIds = new Set(liveMatches.map(m => m.id));
    const uniqueUpcomingMatches = upcomingMatches.filter(match => !liveMatchIds.has(match.id));

    const allMatches = [...liveMatches, ...uniqueUpcomingMatches].sort((a,b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

    const simplified = allMatches.map(match => ({
        id: match.id,
        home_team: match.homeTeam.name,
        away_team: match.awayTeam.name,
        date: match.startingAt.slice(0, 10),
        time: match.startingAt.slice(11, 19),
        sport: match.sportKey
    }));

    return NextResponse.json(simplified);

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch league fixtures', details: error.message }, { status: 500 });
  }
}
