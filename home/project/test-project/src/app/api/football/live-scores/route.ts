
import { NextResponse, type NextRequest } from 'next/server';
import { getLiveScoresFromServer } from '@/lib/sportmonks-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId') ? Number(searchParams.get('leagueId')) : undefined;
    const firstPageOnly = searchParams.get('firstPageOnly') === 'true';

    const data = await getLiveScoresFromServer(leagueId, firstPageOnly);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error in live-scores proxy route:", error);
    return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
  }
}
