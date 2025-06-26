
import { NextResponse, type NextRequest } from 'next/server';

// Cricket API v2.0 endpoint
const SPORTMONKS_CRICKET_API_URL = "https://cricket.sportmonks.com/api/v2.0";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Using v2.0 livescores endpoint. Includes are for team, league, and run details.
  // The 'leagues' parameter is NOT supported on this V2 endpoint, so it has been removed.
  const includes = "localteam,visitorteam,league,runs";
  const url = `${SPORTMONKS_CRICKET_API_URL}/livescores?api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
      next: { revalidate: 15 } // Cache for 15 seconds for live data
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error("Error from Sportmonks Cricket API (v2.0 livescores):", apiResponse.status, errorData);
      let errorMessage = `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - Message: ${errorData.message}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket API (v2.0 livescores) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
