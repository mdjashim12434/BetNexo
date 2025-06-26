
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
    
    // Define the date range for upcoming fixtures (e.g., today to 7 days from now)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 7); // Fetch matches for the next 7 days
    
    const startDate = formatDate(today);
    const endDate = formatDate(futureDate);

    // Includes for upcoming fixtures. participants = teams, league for league info.
    const includes = "participants;league.country;state;odds";
    
    // Filter for H2H odds only to optimize the call
    const marketFilter = "markets:1"; 

    // Filter for leagues included in the user's plan
    const footballLeagueIds = [1107, 1502, 1658, 636, 1088, 1085, 1583, 1356, 181, 211, 1128, 208, 1798, 648, 651, 654, 1631, 1682, 229, 983, 989];
    const leagueIdsFilter = `leagueIds:${footballLeagueIds.join(',')}`;

    // The MatchCard only displays H2H odds, so filtering here reduces payload size.
    const combinedFilters = `${marketFilter};${leagueIdsFilter}`;
    const url = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/between/${startDate}/${endDate}?api_token=${apiKey}&include=${includes}&filters=${combinedFilters}`;
    
    try {
        const response = await fetch(url, {
            cache: 'no-store' // Disable cache to ensure fresh data
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error fetching from Sportmonks proxy for upcoming football fixtures:', response.status, errorData);
            const message = errorData.message || `Failed to fetch football upcoming fixtures. Status: ${response.status}`;
            return NextResponse.json({ error: message }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in football upcoming fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
