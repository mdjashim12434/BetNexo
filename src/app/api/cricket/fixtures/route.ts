
import { NextResponse, type NextRequest } from 'next/server';

// Cricket API v2.0 endpoint
const SPORTMONKS_CRICKET_API_URL = "https://cricket.sportmonks.com/api/v2.0";

// API key is loaded from environment variables for security.
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get('fixtureId');
  
  let url = '';

  if (fixtureId) {
    // Fetch a single fixture with details. 'odds' is included, but can be removed if plan issues arise.
    const includes = "localteam,visitorteam,league,runs,odds"; 
    url = `${SPORTMONKS_CRICKET_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}`;
  } else {
    // Fetch upcoming fixtures. Essential 'includes' are added to ensure data consistency.
    const includes = "localteam,visitorteam,league";
    url = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&sort=starting_at&filter[status]=NS&include=${includes}`;
  }

  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 60 * 5 } // Cache for 5 minutes
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket API:", errorData);
        const message = errorData.message || 'Failed to fetch cricket fixtures from the provider.';
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket API via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
