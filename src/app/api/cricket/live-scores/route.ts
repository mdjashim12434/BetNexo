
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_CRICKET_API_URL = "https://cricket.sportmonks.com/api/v2.0";
const apiKey = process.env.SPORTMONKS_API_KEY;

// Helper to format date to YYYY-MM-DD
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// This route now fetches all fixtures for TODAY to reliably find live matches.
export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  const todayDate = getTodayDateString();

  // v2 includes
  const includes = "localteam,visitorteam,league,runs,venue,stage";
  let baseUrl = `${SPORTMONKS_CRICKET_API_URL}/fixtures?api_token=${apiKey}&filter[date]=${todayDate}&include=${includes}&sort=starting_at&tz=UTC`;

  if (leagueId) {
    baseUrl += `&league_id=${leagueId}`;
  }

  try {
    let allFixtures: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
        const urlWithPage = `${baseUrl}&page=${currentPage}`;
        const apiResponse = await fetch(urlWithPage, {
            cache: 'no-store' // Always fetch fresh data
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error("Error from Sportmonks Cricket Live API (v2) for today's fixtures:", apiResponse.status, errorData);
            let errorMessage = `Failed to fetch live cricket scores. Status: ${apiResponse.status}`;
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

        if (data.meta && data.meta.pagination) {
            totalPages = data.meta.pagination.total_pages;
            currentPage++;
        } else {
            break;
        }
    } while(currentPage <= totalPages);
    
    // The data contains all of today's fixtures. Filtering happens in the service layer.
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket Live API (v2) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
