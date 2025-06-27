
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

// This route now fetches all fixtures for TODAY to reliably find live matches.
export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  const todayDate = getTodayDateString();

  // Includes for comprehensive details to determine live status and scores
  const includes = "participants;scores;periods;league.country;state;events";
  
  let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/date/${todayDate}?api_token=${apiKey}&include=${includes}&tz=UTC`;

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
        cache: 'no-store' // Always fetch fresh data for live/today's matches
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error(`Error from Sportmonks Football API for today's fixtures:`, apiResponse.status, errorData);
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
    
    // The data contains all of today's fixtures. Filtering for live ones happens in the service layer.
    return NextResponse.json({ data: allFixtures });

  } catch (error: any) {
    console.error("Error fetching from Sportmonks Football API via proxy (today's fixtures):", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
