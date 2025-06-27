
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

// This route handles fetching all fixtures for today
export async function GET(request: NextRequest) {
    if (!apiKey) {
        console.error("SPORTMONKS_API_KEY is not set in environment variables.");
        return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
    }
    
    const todayDate = getTodayDateString();

    // Basic includes to keep the call lightweight and avoid plan-related "Forbidden" errors.
    // Odds are fetched on the match detail page, not in this list view.
    const includes = "participants;league.country;state;scores;periods;events";
    
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/date/${todayDate}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    
    try {
        let allFixtures: any[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
            const url = `${baseUrl}&page=${currentPage}`;
            const response = await fetch(url, {
                cache: 'no-store' // Fetch fresh data always
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error fetching from Sportmonks proxy for today\'s football fixtures:', response.status, errorData);
                const message = errorData.message || `Failed to fetch today's football fixtures. Status: ${response.status}`;
                return NextResponse.json({ error: message }, { status: response.status });
            }
            
            const data = await response.json();
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
        console.error('Error in today\'s football fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
