
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.warn("SPORTMONKS_API_KEY is not set. Returning empty data for live scores. Please set the API key in your .env file.");
    return NextResponse.json({ data: [] });
  }
  
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  const firstPageOnly = searchParams.get('firstPageOnly') === 'true';
  
  // Includes for comprehensive details, now excluding odds for list view reliability.
  const includes = "participants;scores;league.country;state;periods";
  let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/livescores?api_token=${apiKey}&include=${includes}&tz=UTC`;

  if (leagueId) {
    baseUrl += `&leagues=${leagueId}`;
  }

  try {
    // Optimization: If only the first page is needed (e.g., for homepage), fetch only that page.
    if (firstPageOnly) {
        const url = `${baseUrl}&page=1`;
        const apiResponse = await fetch(url, { cache: 'no-store' });
        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            const message = errorData.message || `Failed to fetch first page of live scores. Status: ${apiResponse.status}`;
            return NextResponse.json({ error: message }, { status: apiResponse.status });
        }
        const data = await apiResponse.json();
        return NextResponse.json(data);
    }

    // Default behavior: Fetch all pages for comprehensive lists.
    let allFixtures: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
        const urlWithPage = `${baseUrl}&page=${currentPage}`;
        const apiResponse = await fetch(urlWithPage, {
            cache: 'no-store' // Always fetch fresh data for live scores
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error("Error from Sportmonks Football Live API:", apiResponse.status, errorData);
            let errorMessage = `Failed to fetch live football scores. Status: ${apiResponse.status}`;
            if (apiResponse.status === 403 || (errorData.message && errorData.message.includes("plan"))) {
                errorMessage = `Forbidden: Your current API plan does not allow access to this data.`;
            } else if (errorData.message) {
                errorMessage += ` - Message: ${errorData.message}`;
            }
            return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
        }

        const data = await apiResponse.json();
        if (data.data && data.data.length > 0) {
            allFixtures = allFixtures.concat(data.data);
        }
        
        if (data.pagination && data.pagination.has_more) {
            currentPage++;
        } else {
            hasMore = false;
        }
    }
    
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Football Live API via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
