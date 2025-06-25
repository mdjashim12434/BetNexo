
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_API_BASE_URL = "https://api.sportmonks.com/v3/football/livescores/inplay";

export async function GET(request: NextRequest) {
  const apiKey = process.env.SPORTMONKS_API_KEY;

  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY environment variable not set.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  const includes = "participants;scores;periods;events;league.country;round";
  const url = `${SPORTMONKS_API_BASE_URL}?api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error("Error from Sportmonks API (live-scores):", errorData);
        return NextResponse.json({ error: errorData.message || 'Failed to fetch live scores' }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching from Sportmonks API via proxy (live-scores):", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
