
import { NextResponse, type NextRequest } from 'next/server';

// Updated to Cricket API v2.0 endpoint for Live Scores
const SPORTMONKS_API_URL = "https://cricket.sportmonks.com/api/v2.0/livescores";

// API key is loaded from environment variables for security.
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {

  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Includes for live cricket score data
  const includes = "localteam,visitorteam,league,runs";
  const url = `${SPORTMONKS_API_URL}?api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 30 } // Cache for 30 seconds for live data
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket API (live-scores):", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket API via proxy (live-scores):", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
