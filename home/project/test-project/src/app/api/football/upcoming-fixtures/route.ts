
import { NextResponse, type NextRequest } from 'next/server';
import { getUpcomingFixturesFromServer } from '@/lib/sportmonks-server';

// This route handles fetching upcoming fixtures using a date range for better control and reliability.
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const leagueId = searchParams.get('leagueId') ? Number(searchParams.get('leagueId')) : undefined;
        const firstPageOnly = searchParams.get('firstPageOnly') === 'true';

        const data = await getUpcomingFixturesFromServer(leagueId, firstPageOnly);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in football upcoming fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
