
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// Helper to format date to YYYY-MM-DD
const getFormattedDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// This route handles fetching upcoming fixtures using a date range for better control and reliability.
export async function GET(request: NextRequest) {
    if (!apiKey) {
        console.warn("SPORTMONKS_API_KEY is not set. Returning empty data for upcoming fixtures. Please set the API key in your .env file.");
        return NextResponse.json({ data: [] });
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const firstPageOnly = searchParams.get('firstPageOnly') === 'true';

    // Using fixtures/between/{start_date}/{end_date} endpoint as it's more reliable across different plans.
    const today = getFormattedDate(new Date());
    const nextWeek = getFormattedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    // Includes for comprehensive details, but excluding odds to keep it light.
    // The `filter[states]` has been removed as it was causing 400/422 errors.
    // Filtering for "Not Started" matches is now handled reliably in the `sportmonksAPI.ts` service after the data is fetched.
    const includes = "participants;league.country;state";
    
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/between/${today}/${nextWeek}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    
    if (leagueId) {
        baseUrl += `&leagues=${leagueId}`;
    }

    try {
        // Optimization: If only the first page is needed (e.g., for homepage), fetch only that page.
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
            return NextResponse.json(data);
        }

        // Default behavior: Fetch all pages for comprehensive lists.
        let allFixtures: any[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
            const url = `${baseUrl}&page=${currentPage}`;
            const response = await fetch(url, { cache: 'no-store' });

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
