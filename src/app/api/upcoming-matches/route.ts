import { NextResponse } from 'next/server';
import { fetchUpcomingFootballFixtures, fetchUpcomingCricketFixtures } from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';

export async function GET() {
  try {
    const [footballResult, cricketResult] = await Promise.allSettled([
      fetchUpcomingFootballFixtures(),
      fetchUpcomingCricketFixtures()
    ]);

    const upcomingMatches: ProcessedFixture[] = [];

    if (footballResult.status === 'fulfilled') {
      upcomingMatches.push(...footballResult.value);
    }
    if (cricketResult.status === 'fulfilled') {
      upcomingMatches.push(...cricketResult.value);
    }
    
    upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
    
    // In a real scenario you would also filter out live matches here if needed,
    // but for a pure upcoming endpoint, this is fine.

    const simplified = upcomingMatches.map(match => ({
        id: match.id,
        home_team: match.homeTeam.name,
        away_team: match.awayTeam.name,
        date: match.startingAt.slice(0, 10),
        time: match.startingAt.slice(11, 19),
        sport: match.sportKey
    }));

    return NextResponse.json(simplified);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch upcoming matches', details: error.message }, { status: 500 });
  }
}
