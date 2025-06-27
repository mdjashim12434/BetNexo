
import { NextResponse, type NextRequest } from 'next/server';

// Cricket API v2.0 endpoint
const SPORTMONKS_CRICKET_API_URL = "https://cricket.sportmonks.com/api/v2.0";
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

  // v2 includes are comma-separated
  const includes = "localteam,visitorteam,league,runs,venue,odds,stage";
  
  let baseUrl = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&filter[starts_between]=${startDate},${endDate}&include=${includes}&sort=starting_at&tz=UTC`;

  if (leagueId) {
    baseUrl += `&league_id=${leagueId}`; // v2 uses league_id parameter
  }

  try {
    let allFixtures: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
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

        if (data.meta && data.meta.pagination) {
            totalPages = data.meta.pagination.total_pages;
            currentPage++;
        } else {
            // No pagination info, break loop
            break;
        }
    } while (currentPage <= totalPages)
    
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Cricket API (upcoming v2):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}
