
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

  // Recommended includes for comprehensive live score data
  const includes = "participants;scores;periods;events;league.country;round";
  const url = `${SPORTMONKS_API_BASE_URL}?api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error("Error from Sportmonks Football Live API:", errorData);
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
