
import { NextResponse } from 'next/server';

// Fetches odds from The Odds API
export async function GET() {
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    console.error("THE_ODDS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: "Odds API key is not configured on the server." }, { status: 500 });
  }

  // Fetching for a few popular European leagues. 
  // The free plan has a request limit. You can expand this list as needed per The Odds API docs.
  const regions = 'eu'; // Regions: uk, eu, au, us
  const markets = 'h2h,spreads,totals'; // h2h is moneyline, spreads, and totals is over/under
  const oddsFormat = 'decimal';
  // A comma-separated string of sport_keys from The Odds API
  const sportKeys = 'soccer_epl,soccer_spain_la_liga,soccer_italy_serie_a,soccer_germany_bundesliga,soccer_france_ligue_one';

  const url = `https://api.the-odds-api.com/v4/sports/${sportKeys}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
  
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

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error proxying request to The Odds API:", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the odds proxy API.' }, { status: 500 });
  }
}
