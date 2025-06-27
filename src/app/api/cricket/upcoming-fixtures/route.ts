
import { NextResponse, type NextRequest } from 'next/server';

// Updated to V3 endpoint
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

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 10);
    
  const startDate = formatDate(today);
  const endDate = formatDate(futureDate);

  // V3 includes, semicolon-separated
  const includes = "participants;runs;league.country;state;odds;venue;stage";
  
  let baseUrl = `${SPORTMONKS_CRICKET_API_URL}/fixtures/between/${startDate}/${endDate}?api_token=${apiKey}&include=${includes}&tz=UTC`;

  if (leagueId) {
    baseUrl += `&leagues=${leagueId}`; // V3 uses 'leagues' parameter
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
            console.error("Error from Sportmonks Cricket API (upcoming v3):", apiResponse.status, errorData);
            const message = errorData.message || `Failed to fetch upcoming cricket data. Status: ${apiResponse.status}`;
            return NextResponse.json({ error: message }, { status: apiResponse.status });
        }

        const data = await apiResponse.json();
        if (data.data && data.data.length > 0) {
            allFixtures = allFixtures.concat(data.data);
        }

        // V3 pagination check
        if (data.pagination && data.pagination.has_more) {
            currentPage++;
        } else {
            hasMore = false;
        }
    }
    
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (upcoming v3):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}
