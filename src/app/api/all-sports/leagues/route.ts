
import { NextResponse, type NextRequest } from 'next/server';

const FOOTBALL_API_URL = "https://api.sportmonks.com/v3/football/leagues";
const CRICKET_API_URL = "https://cricket.sportmonks.com/api/v2.0/leagues";
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET(request: NextRequest) {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  try {
    const [footballRes, cricketRes] = await Promise.all([
      fetch(`${FOOTBALL_API_URL}?api_token=${apiKey}`),
      fetch(`${CRICKET_API_URL}?api_token=${apiKey}`)
    ]);

    // Handle football response
    let footballData = { data: [] };
    if (footballRes.ok) {
        footballData = await footballRes.json();
    } else {
        console.error(`Failed to fetch football leagues: ${footballRes.status}`);
        // Don't throw, just return empty data for this part
    }

    // Handle cricket response
    let cricketData = { data: [] };
    if (cricketRes.ok) {
        cricketData = await cricketRes.json();
    } else {
        console.error(`Failed to fetch cricket leagues: ${cricketRes.status}`);
        // Don't throw, just return empty data for this part
    }

    return NextResponse.json({
      footballLeagues: footballData.data,
      cricketLeagues: cricketData.data
    });

  } catch (error: any) {
    console.error("Error in all-sports/leagues API route:", error);
    return NextResponse.json({ error: 'An internal server error occurred while fetching league data.' }, { status: 500 });
  }
}
