
import { NextResponse } from 'next/server';
import { getLiveScoresFromServer } from '@/lib/sportmonks-server';
import { processV3FootballFixtures } from '@/services/sportmonksAPI';

export async function GET() {
  try {
    const liveMatchesRaw = await getLiveScoresFromServer(undefined, true);
    const liveMatches = processV3FootballFixtures(liveMatchesRaw);
    
    liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

    return NextResponse.json(liveMatches);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch live matches', details: error.message }, { status: 500 });
  }
}
