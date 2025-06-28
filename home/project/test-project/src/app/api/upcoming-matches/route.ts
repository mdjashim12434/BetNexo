
import { NextResponse } from 'next/server';
import { getUpcomingFixturesFromServer } from '@/lib/sportmonks-server';
import { processV3FootballFixtures } from '@/services/sportmonksAPI';

export async function GET() {
  try {
    const upcomingMatchesRaw = await getUpcomingFixturesFromServer(undefined, true);
    const upcomingMatches = processV3FootballFixtures(upcomingMatchesRaw);

    upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
    
    return NextResponse.json(upcomingMatches);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch upcoming matches', details: error.message }, { status: 500 });
  }
}
