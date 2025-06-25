
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_ODDS_BASE_URL = 'https://api.sportmonks.com/v3/football';

// Switched to using Authorization header as per docs.
// API key is now loaded from environment variables.
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route handles fetching fixtures by either round ID or fixture ID
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');
    const fixtureId = searchParams.get('fixtureId');

    if (!apiKey) {
        return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
    }
    
    if (!roundId && !fixtureId) {
        return NextResponse.json({ error: 'Either roundId or fixtureId must be provided.' }, { status: 400 });
    }

    let url = '';
    const filters = "markets:1;bookmakers:2"; // Example filters, adjust as needed

    if (fixtureId) {
        // Removed 'state' for simplicity and to reduce potential permission issues
        const includes = "odds.market;odds.bookmaker;participants;league.country;comments";
        // api_token query parameter removed from URL
        url = `${SPORTMONKS_ODDS_BASE_URL}/fixtures/${fixtureId}?include=${includes}&filters=${filters}`;
    } else if (roundId) {
        // Removed 'fixtures.state' to reduce complexity and potential permission errors
        const includes = "fixtures.odds.market;fixtures.odds.bookmaker;fixtures.participants;league.country";
        // api_token query parameter removed from URL
        url = `${SPORTMONKS_ODDS_BASE_URL}/rounds/${roundId}?include=${includes}&filters=${filters}`;
    }
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': apiKey
            },
            next: { revalidate: 60 * 5 } // Cache for 5 minutes
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching from Sportmonks proxy for fixtures:', errorData.message);
            return NextResponse.json({ error: `Failed to fetch from Sportmonks: ${errorData.message}` }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in football fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
