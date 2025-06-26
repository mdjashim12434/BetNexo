
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v3/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Using fixtures endpoint with INPLAY state filter. 'state' is the correct filter key for V3.
  // 'state' is a root object on the fixture, not a separate relation, so it should not be in the 'include' string.
  // The correct includes for cricket are participants, league, and runs.
  const includes = "participants,league,runs";
  const stateFilter = "INPLAY"; // Use 'INPLAY' for live matches as per Sportmonks V3 docs
  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures?filter[state]=${stateFilter}&api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
      next: { revalidate: 15 } // Cache for 15 seconds for live data
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error("Error from Sportmonks Cricket API (V3 live fixtures):", apiResponse.status, errorData);
      let errorMessage = `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - Message: ${errorData.message}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket API (V3 live fixtures) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
