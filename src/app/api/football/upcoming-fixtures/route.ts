
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// This route handles fetching upcoming fixtures for a specific date range
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

    const includes = "participants;league.country;state;odds";
    
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/between/${startDate}/${endDate}?api_token=${apiKey}&include=${includes}`;
    
    if (leagueId) {
        baseUrl += `&leagues=${leagueId}`;
    }

    try {
        let allFixtures: any[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
            const url = `${baseUrl}&page=${currentPage}`;
            const response = await fetch(url, {
                next: { revalidate: 60 } // Cache for 1 minute
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error fetching from Sportmonks proxy for upcoming football fixtures:', response.status, errorData);
                const message = errorData.message || `Failed to fetch football upcoming fixtures. Status: ${response.status}`;
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
        console.error('Error in football upcoming fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
