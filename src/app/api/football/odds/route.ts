
import { NextResponse } from 'next/server';

// Fetches odds from The Odds API
export async function GET() {
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    console.error("THE_ODDS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: "Odds API key is not configured on the server." }, { status: 500 });
  }

  // Using the 'upcoming' endpoint to get a wide range of odds across all sports.
  // We will filter for soccer events after fetching.
  const regions = 'us,uk,eu,au'; // Regions: us, uk, eu, au - Fetch from all major regions for worldwide coverage.
  const markets = 'h2h,totals'; // h2h is moneyline, and totals is over/under.
  const oddsFormat = 'decimal';
  
  const url = `https://api.the-odds-api.com/v4/sports/upcoming/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
  
  try {
    // Odds data changes frequently, so we fetch fresh data.
    const apiResponse = await fetch(url, {
        cache: 'no-store'
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from The Odds API:", apiResponse.status, errorData);
        const message = errorData.message || `Failed to fetch odds data. Status: ${apiResponse.status}`;
        return NextResponse.json({ error: message }, { status: apiResponse.status });
    }

    const allSportsOdds = await apiResponse.json();
    
    // Filter the results to only include football (soccer) odds
    const footballOdds = allSportsOdds.filter((odd: any) => odd.sport_key && odd.sport_key.startsWith('soccer_'));

    return NextResponse.json(footballOdds);

  } catch (error: any) {
    console.error("Error proxying request to The Odds API:", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the odds proxy API.' }, { status: 500 });
  }
}
