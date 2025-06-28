
import { NextResponse } from 'next/server';

// Updated to V2 endpoint as requested by user for stability
const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v2.0/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET() {
  if (!apiKey) {
    console.warn("SPORTMONKS_API_KEY is not set. Returning empty data for cricket leagues. Please set the API key in your .env file.");
    return NextResponse.json({ data: [] });
  }

  const url = `${SPORTMONKS_CRICKET_API_URL}/leagues?api_token=${apiKey}`;
  
  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error(`Cricket leagues API (v2) failed with status ${apiResponse.status}:`, await apiResponse.text());
        return NextResponse.json({ error: 'Failed to fetch cricket leagues' }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Fetching cricket leagues (v2) failed:", error);
    return NextResponse.json({ error: 'Internal server error while fetching cricket leagues' }, { status: 500 });
  }
}
