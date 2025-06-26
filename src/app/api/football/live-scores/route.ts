
import { NextResponse, type NextRequest } from 'next/server';

// Football v3 endpoint for live scores
const SPORTMONKS_API_BASE_URL = "https://api.sportmonks.com/v3/football/livescores/inplay";

// API key is loaded from environment variables for security.
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Recommended includes for comprehensive live score data, including player details for events
  const includes = "participants;scores;periods;events.type;events.participant;league.country;state";
  
  // Filter for leagues included in the user's plan
  const footballLeagueIds = [1107, 1502, 1658, 636, 1088, 1085, 1583, 1356, 181, 211, 1128, 208, 1798, 648, 651, 654, 1631, 1682, 229, 983, 989];
  const leagueIdsParam = `&leagues=${footballLeagueIds.join(',')}`;

  const url = `${SPORTMONKS_API_BASE_URL}?api_token=${apiKey}&include=${includes}${leagueIdsParam}`;

  try {
    const apiResponse = await fetch(url, {
      next: { revalidate: 10 } // Cache for 10 seconds for live data
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error("Error from Sportmonks Football Live API:", apiResponse.status, errorData);
      let errorMessage = `Failed to fetch football live scores. Status: ${apiResponse.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - Message: ${errorData.message}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Football Live API via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
