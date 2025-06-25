
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_API_BASE_URL = "https://api.sportmonks.com/v3/football/livescores/inplay";

// API key is loaded from environment variables for security.
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {

  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Simplified includes to the minimum required by the UI to reduce permission error chances
  const includes = "participants;scores;league.country";
  // Authenticate using the 'api_token' query parameter for reliability
  const url = `${SPORTMONKS_API_BASE_URL}?include=${includes}&api_token=${apiKey}`;

  try {
    const apiResponse = await fetch(url, {
        // The API token is in the URL, so no special headers are needed.
        next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error("Error from Sportmonks API (live-scores):", errorData);
        return NextResponse.json({ error: errorData.message || 'Failed to fetch live scores' }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching from Sportmonks API via proxy (live-scores):", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
