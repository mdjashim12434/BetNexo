
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

  // Fetch upcoming fixtures. Essential 'includes' are added to ensure data consistency.
  // 'status=NS' filters for "Not Started" matches.
  const includes = "localteam,visitorteam,league,odds";
  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&sort=starting_at&filter[status]=NS&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 60 * 15 } // Cache for 15 minutes
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket API (upcoming):", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch upcoming cricket data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (upcoming):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
