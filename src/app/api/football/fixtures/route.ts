
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_ODDS_BASE_URL = 'https://api.sportmonks.com/v3/football';

// API key is loaded from environment variables for security.
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

    let baseUrl = '';
    const filters = "markets:1;bookmakers:2"; // Example filters, adjust as needed

    if (fixtureId) {
        // Includes for a single fixture
        const includes = "odds.market;odds.bookmaker;participants;league.country;comments";
        baseUrl = `${SPORTMONKS_ODDS_BASE_URL}/fixtures/${fixtureId}?include=${includes}&filters=${filters}`;
    } else if (roundId) {
        // Includes for all fixtures in a round
        const includes = "fixtures.odds.market;fixtures.odds.bookmaker;fixtures.participants;league.country";
        baseUrl = `${SPORTMONKS_ODDS_BASE_URL}/rounds/${roundId}?include=${includes}&filters=${filters}`;
    }
    
    // Authenticate using the 'api_token' query parameter for reliability
    const url = `${baseUrl}&api_token=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            // The API token is in the URL, so no special headers are needed.
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
