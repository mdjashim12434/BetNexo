
import { NextResponse, type NextRequest } from 'next/server';

// Cricket API v2.0 endpoint for live scores
const SPORTMONKS_API_BASE_URL = "https://cricket.sportmonks.com/api/v2.0/livescores";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // v2 includes
  const includes = "localteam,visitorteam,league,runs,venue,stage";
  const baseUrl = `${SPORTMONKS_API_BASE_URL}?api_token=${apiKey}&include=${includes}`;

  try {
    let allFixtures: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
        const url = `${baseUrl}&page=${currentPage}`;
        const apiResponse = await fetch(url, {
            cache: 'no-store' // Always fetch fresh data
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error("Error from Sportmonks Cricket Live API (v2):", apiResponse.status, errorData);
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
    
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Cricket Live API (v2) via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
