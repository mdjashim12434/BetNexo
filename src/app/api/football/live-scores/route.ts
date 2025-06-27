
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// Helper to format date to YYYY-MM-DD
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// This route now fetches all fixtures for TODAY to find live matches more reliably.
export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  const todayDate = getTodayDateString();

  // Basic includes for determining live status and scores. 'events' is removed for better compatibility.
  const includes = "participants;scores;periods;league.country;state";
  let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/date/${todayDate}?api_token=${apiKey}&include=${includes}&tz=UTC`;

  if (leagueId) {
    baseUrl += `&leagues=${leagueId}`;
  }

  try {
    let allFixtures: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while(hasMore) {
        const urlWithPage = `${baseUrl}&page=${currentPage}`;
        const apiResponse = await fetch(urlWithPage, {
            cache: 'no-store' // Always fetch fresh data for live scores
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error("Error from Sportmonks Football API (today's fixtures):", apiResponse.status, errorData);
            let errorMessage = `Failed to fetch live football scores. Status: ${apiResponse.status}`;
            if (apiResponse.status === 403 || (errorData.message && errorData.message.includes("plan"))) {
                errorMessage = `Forbidden: Your current API plan does not allow access to this data.`;
            } else if (errorData && errorData.message) {
                errorMessage += ` - Message: ${errorData.message}`;
            }
            return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
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
    
    // The data contains all of today's fixtures. Filtering will happen in the service layer.
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Football API (today's fixtures) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
