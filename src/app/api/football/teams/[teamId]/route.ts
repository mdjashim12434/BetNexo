
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route handles fetching team details, including upcoming matches.
export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
    const { teamId } = params;

    if (!apiKey) {
        console.warn("SPORTMONKS_API_KEY is not set. Returning empty data for team details. Please set the API key in your .env file.");
        return NextResponse.json({ data: null });
    }
    
    if (!teamId) {
        return NextResponse.json({ error: 'A teamId must be provided to get team details.' }, { status: 400 });
    }

    // Includes for upcoming matches as requested.
    const includes = "upcoming.participants;upcoming.league";

    const url = `${SPORTMONKS_FOOTBALL_API_URL}/teams/${teamId}?api_token=${apiKey}&include=${includes}`;
    
    try {
        const response = await fetch(url, {
            cache: 'no-store' // Fetch fresh data for upcoming schedules
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Error from Sportmonks proxy for team details (ID: ${teamId}):`, response.status, errorData);
            const message = errorData.message || `Failed to fetch team details. Status: ${response.status}`;
            return NextResponse.json({ error: message }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error(`Error in football team details proxy route (ID: ${teamId}):`, error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
