
import { NextResponse, type NextRequest } from 'next/server';

// Football v3 endpoint for live scores
const SPORTMONKS_API_BASE_URL = "https://api.sportmonks.com/v3/football/livescores/inplay";

// API key is loaded from environment variables for security.
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');

  const includes = "participants;scores;periods;events;league.country;round";
  
  let baseUrl = `${SPORTMONKS_API_BASE_URL}?api_token=${apiKey}&include=${includes}`;

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
        cache: 'no-store' // Always fetch fresh data
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Football Live API:", apiResponse.status, errorData);
        let errorMessage = `Failed to fetch football live scores. Status: ${apiResponse.status}`;
        if (apiResponse.status === 403) {
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
