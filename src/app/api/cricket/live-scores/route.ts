
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v3/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Use /fixtures with status=LIVE as requested to get full fixture details for live games.
  // Corrected includes for Cricket V3 API. 'scores' and 'events' are not valid includes for cricket fixtures.
  const includes = "participants,league,runs";
  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&filter[status]=Live&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
      next: { revalidate: 15 } // Cache for 15 seconds for live data
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error("Error from Sportmonks Cricket Live API (V3 fixtures):", apiResponse.status, errorData);
      let errorMessage = `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - Message: ${errorData.message}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket Live API (V3 fixtures) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
