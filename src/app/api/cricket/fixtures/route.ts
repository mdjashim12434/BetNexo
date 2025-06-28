
import { NextResponse, type NextRequest } from 'next/server';

// Updated to V2 endpoint as requested by user for stability
const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v2.0/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.warn("SPORTMONKS_API_KEY is not set. Returning empty data for cricket fixture details. Please set the API key in your .env file.");
    return NextResponse.json({ data: null });
  }

  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get('fixtureId');
  
  if (!fixtureId) {
    return NextResponse.json({ error: 'A fixtureId must be provided to get match details.' }, { status: 400 });
  }

  // V2 includes, comma-separated.
  const includes = "localteam,visitorteam,runs,league,stage,venue,officials,comments";
  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}&tz=UTC`;

  try {
    const apiResponse = await fetch(url, {
        cache: 'no-store' // Fetch fresh data
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket API (single fixture v2):", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch cricket data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (single fixture v2):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}
