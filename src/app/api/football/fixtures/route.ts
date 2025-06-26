
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';

// API key is loaded from environment variables for security.
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route handles fetching fixtures by fixture ID
export async function GET(request: NextRequest) {
    if (!apiKey) {
        console.error("SPORTMONKS_API_KEY is not set in environment variables.");
        return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const fixtureId = searchParams.get('fixtureId');
    
    if (!fixtureId) {
        return NextResponse.json({ error: 'A fixtureId must be provided to get match details.' }, { status: 400 });
    }

    // Includes for comprehensive details, combining original and new requirements.
    const includes = "odds;participants;league.country;comments;venue;referee;state;scores;events;statistics;sidelined;weatherReport";

    const url = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}`;
    
    try {
        const response = await fetch(url, {
            next: { revalidate: 60 * 5 } // Cache for 5 minutes
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
