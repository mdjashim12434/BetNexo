
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
    // Fetch a single fixture with details
    // Note: includes might differ for cricket, adjust as needed. Common ones are team, league, odds.
    const includes = "localteam,visitorteam,league,runs,odds"; 
    url = `${SPORTMONKS_CRICKET_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}`;
  } else {
    // Fetch upcoming fixtures (default)
    // Filters can be added, e.g., status=NS for 'Not Started'
    url = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&sort=starting_at&filter[status]=NS`;
  }

  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 60 * 5 } // Cache for 5 minutes
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error("Error from Sportmonks Cricket API:", errorData);
        return NextResponse.json({ error: errorData.message || 'Failed to fetch cricket fixtures' }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket API via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
