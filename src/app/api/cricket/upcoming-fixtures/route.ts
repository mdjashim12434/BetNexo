
import { NextResponse, type NextRequest } from 'next/server';

// Cricket API v2.0 endpoint
const SPORTMONKS_CRICKET_API_URL = "https://cricket.sportmonks.com/api/v2.0";
const apiKey = process.env.SPORTMONKS_API_KEY;

// Leagues included in the user's plan
const cricketLeagueIds = [7, 11, 5, 29, 32, 225, 9, 216, 237, 186, 231, 264, 13, 19, 47, 138, 141, 189, 83, 294, 168, 204, 180, 183, 222, 228, 1, 106, 276, 255, 288, 234, 317, 314, 282, 249, 6, 8, 252, 320, 150, 243, 10, 270, 100, 171, 177, 22, 23, 3, 12, 16, 17, 35, 258, 261, 2, 4, 18, 41, 86, 201, 14, 15];

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

  // Includes for upcoming fixtures. localteam/visitorteam, league for info, odds for betting.
  const includes = "localteam,visitorteam,league,odds";
  // For v2.0, leagues are passed as a comma-separated parameter.
  const leaguesParam = `&leagues=${cricketLeagueIds.join(',')}`;
  // For v2.0, date range is a filter parameter
  const dateFilter = `&filter[starts_between]=${startDate},${endDate}`;

  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&include=${includes}${leaguesParam}${dateFilter}&sort=starting_at`;

  try {
    const apiResponse = await fetch(url, {
        cache: 'no-store' // Disable cache to ensure fresh data
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Cricket API (upcoming v2.0):", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch upcoming cricket data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (upcoming v2.0):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
