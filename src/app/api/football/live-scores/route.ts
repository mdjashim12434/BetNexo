
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  
  // Directly targeting the livescores endpoint.
  // This endpoint is optimized for speed and does not support complex includes like 'events' on all plans.
  // Removing 'events' to prevent API errors. 'periods' is kept for the live minute.
  const includes = "participants;scores;league.country;state;periods";
  let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/livescores?api_token=${apiKey}&include=${includes}&tz=UTC`;

  if (leagueId) {
    baseUrl += `&leagues=${leagueId}`;
  }

  try {
    const apiResponse = await fetch(baseUrl, {
        cache: 'no-store' // Always fetch fresh data for live scores
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Football Live API:", apiResponse.status, errorData);
        let errorMessage = `Failed to fetch live football scores. Status: ${apiResponse.status}`;
        if (apiResponse.status === 403 || (errorData.message && errorData.message.includes("plan"))) {
            errorMessage = `Forbidden: Your current API plan does not allow access to this data.`;
        } else if (errorData.message) {
            errorMessage += ` - Message: ${errorData.message}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    // The data from /livescores should only contain live matches, so no extra filtering is needed here.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Football Live API via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
