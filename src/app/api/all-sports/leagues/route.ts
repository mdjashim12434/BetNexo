
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.SPORTMONKS_API_KEY;

  if (!apiKey) {
    console.warn("SPORTMONKS_API_KEY is not set. Returning empty list of leagues. Please set the API key in your .env file.");
    return NextResponse.json({ leagues: [] });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

  try {
    const footballResult = await fetch(`${apiBaseUrl}/api/football/leagues`, { next: { revalidate: 3600 } });

    if (!footballResult.ok) {
      const errorText = await footballResult.text();
      console.error("Fetching football leagues failed:", `Status: ${footballResult.status}`, errorText);
      return NextResponse.json({ error: 'Failed to fetch football leagues' }, { status: footballResult.status });
    }

    const footballData = await footballResult.json();
    const footballLeagues = footballData.data ?? [];
    
    // Return a single `leagues` array for simplicity
    return NextResponse.json({ leagues: footballLeagues });
  } catch (error) {
    console.error("Error in /api/all-sports/leagues:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
