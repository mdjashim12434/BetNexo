
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route now uses the dedicated /livescores endpoint for maximum reliability.
export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');

  // Includes for comprehensive details to determine live status and scores
  const includes = "participants;scores;periods;league.country;state;events";
  
  // Using the dedicated /livescores endpoint as it's the most direct way to get live matches.
  let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/livescores?api_token=${apiKey}&include=${includes}&tz=UTC`;

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
        cache: 'no-store' // Always fetch fresh data for live matches
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error(`Error from Sportmonks Football LiveScores API:`, apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch football data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
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
    
    // The data now contains only live fixtures.
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Football LiveScores API via proxy:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
