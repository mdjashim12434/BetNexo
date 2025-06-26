
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v3/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

// Leagues included in the user's plan
const cricketLeagueIds = [7, 11, 5, 29, 32, 225, 9, 216, 237, 186, 231, 264, 13, 19, 47, 138, 141, 189, 83, 294, 168, 204, 180, 183, 222, 228, 1, 106, 276, 255, 288, 234, 317, 314, 282, 249, 6, 8, 252, 320, 150, 243, 10, 270, 100, 171, 177, 22, 23, 3, 12, 16, 17, 35, 258, 261, 2, 4, 18, 41, 86, 201, 14, 15];

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // Using fixtures endpoint with INPLAY state filter. 'states' and 'leagueIds' are the correct filter keys for V3.
  const includes = "participants,league,runs";
  const stateFilter = "INPLAY"; // Use 'INPLAY' for live matches as per Sportmonks V3 docs
  
  // Combine all filters into a single string, separated by semicolons
  const filters = `states:${stateFilter};leagueIds:${cricketLeagueIds.join(',')}`;
  
  const url = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&include=${includes}&filters=${filters}`;

  try {
    const apiResponse = await fetch(url, {
      next: { revalidate: 15 } // Cache for 15 seconds for live data
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error("Error from Sportmonks Cricket API (V3 live fixtures):", apiResponse.status, errorData);
      let errorMessage = `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - Message: ${errorData.message}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket API (V3 live fixtures) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
