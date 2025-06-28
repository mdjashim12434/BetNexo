

import { NextResponse, type NextRequest } from 'next/server';
import { getFixtureDetailsFromServer } from '@/lib/sportmonks-server';

// This route handles fetching fixtures by fixture ID
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fixtureId = searchParams.get('fixtureId');
        
        if (!fixtureId) {
            return NextResponse.json({ error: 'A fixtureId must be provided to get match details.' }, { status: 400 });
        }

        const data = await getFixtureDetailsFromServer(Number(fixtureId));
        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('Error in football fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
