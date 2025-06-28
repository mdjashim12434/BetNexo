
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
  // A comma-separated string of sport_keys from The Odds API. Expanded to include more worldwide leagues.
  const sportKeys = 'soccer_epl,soccer_spain_la_liga,soccer_italy_serie_a,soccer_germany_bundesliga,soccer_france_ligue_one,soccer_uefa_champs_league,soccer_uefa_europa_league,soccer_australia_a_league,soccer_austria_bundesliga,soccer_belgium_first_div,soccer_brazil_campeonato,soccer_denmark_superliga,soccer_greece_super_league,soccer_mexico_ligamx,soccer_netherlands_eredivisie,soccer_norway_eliteserien,soccer_portugal_primeira_liga,soccer_russia_premier_league,soccer_scotland_premier_league,soccer_sweden_allsvenskan,soccer_switzerland_super_league,soccer_turkey_super_lig,soccer_usa_mls';

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
