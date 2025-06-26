
import { NextResponse, type NextRequest } from 'next/server';

// Cricket API v3 endpoint
const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v3/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Define the date range for upcoming fixtures (e.g., today to 7 days from now)
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 7);
    
  const startDate = formatDate(today);
  const endDate = formatDate(futureDate);

  // Includes for upcoming fixtures. participants = teams, league for league info, odds for betting.
  const includes = "participants,league,odds";

  // Removed markets and bookmakers filters to simplify the API call and avoid potential errors.
  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures/between/${startDate}/${endDate}?api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 60 * 15 } // Cache for 15 minutes
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket API (upcoming v3):", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch upcoming cricket data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (upcoming v3):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
