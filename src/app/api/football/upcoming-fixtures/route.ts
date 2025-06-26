
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route handles fetching upcoming fixtures
export async function GET(request: NextRequest) {
    if (!apiKey) {
        console.error("SPORTMONKS_API_KEY is not set in environment variables.");
        return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
    }

    // Includes for upcoming fixtures. We get participants, league, state, and basic odds.
    const includes = "participants;league.country;state;odds";
    // Filter for a popular bookmaker (id: 2 for Bet365) and main market (id: 1 for 3-Way Result) to get odds data
    const filters = "bookmakers:2;markets:1"; 

    const url = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/upcoming?api_token=${apiKey}&include=${includes}&filters=${filters}`;
    
    try {
        const response = await fetch(url, {
            next: { revalidate: 60 * 15 } // Cache for 15 minutes
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error fetching from Sportmonks proxy for upcoming football fixtures:', response.status, errorData);
            const message = errorData.message || `Failed to fetch football upcoming fixtures. Status: ${response.status}`;
            return NextResponse.json({ error: message }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in football upcoming fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
