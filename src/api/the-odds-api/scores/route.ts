
import { NextResponse } from 'next/server';

// Fetches live and recent scores from The Odds API
export async function GET() {
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    console.warn("THE_ODDS_API_KEY is not set. Returning empty data for scores.");
    return NextResponse.json([]);
  }

  // Fetch scores for all soccer fixtures that are live or started within the last 24 hours.
  const sport = 'soccer'; // Use the generic 'soccer' key for scores
  const daysFrom = '1'; 
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/scores/?apiKey=${apiKey}&daysFrom=${daysFrom}`;
  
  try {
    const apiResponse = await fetch(url, {
        cache: 'no-store' // Scores data changes very frequently
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from The Odds API (scores):", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch scores data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const scores = await apiResponse.json();
    return NextResponse.json(scores);

  } catch (error: any) {
    console.error("Error proxying request to The Odds API (scores):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the odds scores proxy API.' }, { status: 500 });
  }
}
