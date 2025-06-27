import { NextResponse } from 'next/server';
import { fetchLiveFootballFixtures } from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';

export async function GET() {
  try {
    const liveMatches: ProcessedFixture[] = await fetchLiveFootballFixtures();
    
    liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

    const simplified = liveMatches.map(match => ({
        id: match.id,
        home_team: match.homeTeam.name,
        away_team: match.awayTeam.name,
        date: match.startingAt.slice(0, 10),
        time: match.startingAt.slice(11, 19),
        sport: match.sportKey
    }));

    return NextResponse.json(simplified);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch live matches', details: error.message }, { status: 500 });
  }
}
