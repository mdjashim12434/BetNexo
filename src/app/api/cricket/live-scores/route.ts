
import { NextResponse, type NextRequest } from 'next/server';

// Updated to V2 endpoint as requested by user for stability
const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v2.0/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.warn("SPORTMONKS_API_KEY is not set. Returning empty data for live cricket scores. Please set the API key in your .env file.");
    return NextResponse.json({ data: [] });
  }
  
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');

  // V2 includes, comma-separated
  const includes = "localteam,visitorteam,runs,league,stage";
  let baseUrl = `${SPORTMONKS_CRICKET_API_URL}/livescores?api_token=${apiKey}&include=${includes}&tz=UTC`;

  if (leagueId) {
    baseUrl += `&leagues=${leagueId}`; // V2 also uses 'leagues' parameter
  }

  try {
    const apiResponse = await fetch(baseUrl, {
        cache: 'no-store' // Always fetch fresh data
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket Live API (v2):", apiResponse.status, errorData);
        let errorMessage = `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
        if (apiResponse.status === 403 || (errorData.message && errorData.message.includes("plan"))) {
            errorMessage = `Forbidden: Your current API plan does not allow access to this data.`;
        } else if (errorData && errorData.message) {
            errorMessage += ` - Message: ${errorData.message}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    // V2 livescores endpoint is reliable for live matches.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket Live API (v2) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
