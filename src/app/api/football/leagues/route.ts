
import { NextResponse } from 'next/server';

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET() {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return new Response(JSON.stringify({ error: "API key is not configured on the server." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/leagues?api_token=${apiKey}`;
  
  try {
    let allLeagues: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
        const urlWithPage = `${baseUrl}&page=${currentPage}`;
        const apiResponse = await fetch(urlWithPage, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error(`Football leagues API failed with status ${apiResponse.status}:`, await apiResponse.text());
            return NextResponse.json({ error: 'Failed to fetch football leagues' }, { status: apiResponse.status });
        }

        const data = await apiResponse.json();
        if (data.data && data.data.length > 0) {
            allLeagues = allLeagues.concat(data.data);
        }
        
        if (data.pagination && data.pagination.has_more) {
            currentPage++;
        } else {
            hasMore = false;
        }
    }
    
    return NextResponse.json({ data: allLeagues });
    
  } catch (error) {
    console.error("Fetching football leagues failed:", error);
    return NextResponse.json({ error: 'Internal server error while fetching football leagues' }, { status: 500 });
  }
}
