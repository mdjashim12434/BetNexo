
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';

// API key is loaded from environment variables for security.
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route handles fetching fixtures by fixture ID
export async function GET(request: NextRequest) {
    if (!apiKey) {
        console.warn("SPORTMONKS_API_KEY is not set. Returning empty data for fixture details. Please set the API key in your .env file.");
        return NextResponse.json({ data: null });
    }

    const { searchParams } = new URL(request.url);
    const fixtureId = searchParams.get('fixtureId');
    
    if (!fixtureId) {
        return NextResponse.json({ error: 'A fixtureId must be provided to get match details.' }, { status: 400 });
    }

    // Includes for comprehensive details, now excluding odds.
    const includes = "participants;league.country;state;scores;periods;events;comments";

    const url = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    
    try {
        const response = await fetch(url, {
            cache: 'no-store' // Fetch fresh data
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error from Sportmonks proxy for fixture details:', response.status, errorData);
            const message = errorData.message || `Failed to fetch football fixture details. Status: ${response.status}`;
            return NextResponse.json({ error: message }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in football fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
