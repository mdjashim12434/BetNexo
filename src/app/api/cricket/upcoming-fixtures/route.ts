
import { NextResponse, type NextRequest } from 'next/server';

// Updated to V2 endpoint as requested by user for stability
const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v2.0/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');

  // V2 includes, comma-separated. No odds needed for upcoming.
  const includes = "localteam,visitorteam,league,stage,venue";
  
  // Using filter by status=NS (Not Started) and sorting by date for upcoming matches
  let baseUrl = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&include=${includes}&tz=UTC&filter[status]=NS&sort=starting_at`;

  if (leagueId) {
    baseUrl += `&leagues=${leagueId}`;
  }

  try {
    let allFixtures: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${baseUrl}&page=${currentPage}`;
        const apiResponse = await fetch(url, {
            cache: 'no-store' // Fetch fresh data
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error("Error from Sportmonks Cricket API (upcoming v2):", apiResponse.status, errorData);
            const message = errorData.message || `Failed to fetch upcoming cricket data. Status: ${apiResponse.status}`;
            return NextResponse.json({ error: message }, { status: apiResponse.status });
        }

        const data = await apiResponse.json();
        if (data.data && data.data.length > 0) {
            allFixtures = allFixtures.concat(data.data);
        }

        // V2 pagination check
        if (data.meta && data.meta.pagination && data.meta.pagination.current_page < data.meta.pagination.total_pages) {
            currentPage++;
        } else {
            hasMore = false;
        }
    }
    
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (upcoming v2):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}
