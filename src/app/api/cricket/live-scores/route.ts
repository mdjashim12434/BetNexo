
import { NextResponse, type NextRequest } from 'next/server';

// Cricket API v3 endpoint for live scores
const SPORTMONKS_API_BASE_URL = "https://api.sportmonks.com/v3/cricket/livescores/inplay";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Reduced includes to fetch essential live score data, avoiding potentially premium data like officials.
  const includes = "participants;league.country;state;runs";
  
  const url = `${SPORTMONKS_API_BASE_URL}?api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
      cache: 'no-store' // Always fetch fresh data
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error("Error from Sportmonks Cricket Live API (v3):", apiResponse.status, errorData);
      let errorMessage = `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
      if (apiResponse.status === 403) {
        errorMessage = `Forbidden: Your current API plan does not allow access to this data.`;
      } else if (errorData && errorData.message) {
        errorMessage += ` - Message: ${errorData.message}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket Live API (v3) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
