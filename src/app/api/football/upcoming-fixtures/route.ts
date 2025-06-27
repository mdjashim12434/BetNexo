
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route handles fetching upcoming fixtures using the dedicated 'upcoming' endpoint for reliability.
export async function GET(request: NextRequest) {
    if (!apiKey) {
        console.error("SPORTMONKS_API_KEY is not set in environment variables.");
        return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const firstPageOnly = searchParams.get('firstPageOnly') === 'true';

    // The 'upcoming' endpoint is cleaner and more reliable than fetching by date range.
    // Odds are not included here to keep the request light and avoid potential plan restrictions on list endpoints.
    const includes = "participants;league.country;state";
    
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/upcoming?api_token=${apiKey}&include=${includes}&tz=UTC`;
    
    if (leagueId) {
        baseUrl += `&leagues=${leagueId}`;
    }

    try {
        // Optimization: If only the first page is needed (e.g., for homepage), fetch only that page to prevent timeouts.
        if (firstPageOnly) {
            const url = `${baseUrl}&page=1`;
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error fetching first page of upcoming football fixtures:', response.status, errorData);
                const message = errorData.message || `Failed to fetch data. Status: ${response.status}`;
                return NextResponse.json({ error: message }, { status: response.status });
            }
            const data = await response.json();
            // The /fixtures/upcoming endpoint should only return non-started matches, so no extra filtering is needed here.
            return NextResponse.json(data);
        }

        // Default behavior: Fetch all pages for comprehensive lists (e.g., dedicated sports pages).
        let allFixtures: any[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
            const url = `${baseUrl}&page=${currentPage}`;
            const response = await fetch(url, {
                cache: 'no-store' // Fetch fresh data
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
