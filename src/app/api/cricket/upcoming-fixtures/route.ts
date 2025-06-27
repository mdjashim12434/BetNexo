
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_CRICKET_API_URL = "https://api.sportmonks.com/v2.0/cricket";
const apiKey = process.env.SPORTMONKS_API_KEY;

// Helper to format date to YYYY-MM-DD, which is required by Sportmonks `starts_between` filter.
const getFormattedDate = (date: Date): string => {
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

  const includes = "localteam,visitorteam,league,stage,venue";
  
  // Using filter by date range as requested by the user for more precise upcoming match data.
  const today = getFormattedDate(new Date());
  const nextWeek = getFormattedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  
  let baseUrl = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&include=${includes}&tz=UTC&filter[starts_between]=${today},${nextWeek}&sort=starting_at`;

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
            cache: 'no-store' // Fetch fresh data for upcoming matches
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error("Error from Sportmonks Cricket API (upcoming v2):", apiResponse.status, errorData);
            const message = errorData.message || `Failed to fetch upcoming cricket data. Status: ${apiResponse.status}`;
            return NextResponse.json({ error: message }, { status: apiResponse.status });
        }

        const data = await apiResponse.json();
        if (data.data && data.data.length > 0) {
            // Further ensure that only matches that have not started are included.
            const notStartedFixtures = data.data.filter((fixture: any) => fixture.status === 'NS');
            allFixtures = allFixtures.concat(notStartedFixtures);
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
