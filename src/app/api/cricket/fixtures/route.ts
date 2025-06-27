
import { NextResponse, type NextRequest } from 'next/server';

// Updated to V3 endpoint
const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v3/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get('fixtureId');
  
  if (!fixtureId) {
    return NextResponse.json({ error: 'A fixtureId must be provided to get match details.' }, { status: 400 });
  }

  // V3 includes, semicolon-separated. Added odds.bookmaker to get more details.
  const includes = "participants;runs;league.country;state;venue;officials;stage;comments;odds.bookmaker";
  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}&tz=UTC`;

  try {
    const apiResponse = await fetch(url, {
        cache: 'no-store' // Fetch fresh data
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket API (single fixture v3):", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch cricket data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (single fixture v3):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}
