
import { NextResponse, type NextRequest } from 'next/server';
import type { MatchDataAPI, MarketAPI, OutcomeAPI, SimplifiedMatchOdds, TotalMarketOutcome } from '@/types/odds';

const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get('sportKey');
  const regions = searchParams.get('regions') || 'uk';
  // Fetch both h2h and totals markets
  const markets = searchParams.get('markets') || 'h2h,totals'; 
  const oddsFormat = searchParams.get('oddsFormat') || 'decimal';
  
  const apiKey = process.env.ODDS_API_KEY;

  if (!sportKey) {
    return NextResponse.json({ error: 'sportKey query parameter is required' }, { status: 400 });
  }
  if (!apiKey) {
    console.error("CRITICAL: ODDS_API_KEY is missing from environment variables.");
    return NextResponse.json({ error: 'API key for The Odds API is not configured on the server.' }, { status: 500 });
  }

  const url = `${ODDS_API_BASE_URL}/${sportKey}/odds/?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
  const maskedUrl = url.replace(apiKey, '********');
  console.log(`API Route: Fetching odds from URL: ${maskedUrl}`);

  try {
    const response = await fetch(url, { next: { revalidate: 60 } }); // Cache for 60 seconds

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from The Odds API." }));
      console.error('The Odds API HTTP error in API Route:', response.status, response.statusText, errorData);
      let apiErrorMessage = `HTTP ${response.status} ${response.statusText}`;
      if (errorData && errorData.message) {
        apiErrorMessage += ` - Message: ${errorData.message}`;
      }
      return NextResponse.json({ error: `Failed to fetch odds from The Odds API. ${apiErrorMessage}` }, { status: response.status });
    }

    const data: MatchDataAPI[] = await response.json();

    const simplifiedMatches: SimplifiedMatchOdds[] = data.map(match => {
      let homeWinOdds: number | undefined;
      let awayWinOdds: number | undefined;
      let drawOdds: number | undefined;
      let bookmakerTitle: string | undefined;
      let totalsMarketData: TotalMarketOutcome | undefined;

      if (match.bookmakers && match.bookmakers.length > 0) {
        // Prioritize a well-known bookmaker or the first one
        const bookie = match.bookmakers.find(b => ['bet365', 'unibet', 'williamhill'].includes(b.key.toLowerCase())) || match.bookmakers[0];
        bookmakerTitle = bookie.title;

        // Parse H2H market
        const h2hMarket = bookie.markets.find(m => m.key === 'h2h');
        if (h2hMarket) {
          h2hMarket.outcomes.forEach(outcome => {
            if (outcome.name === match.home_team) homeWinOdds = outcome.price;
            else if (outcome.name === match.away_team) awayWinOdds = outcome.price;
            else if (outcome.name.toLowerCase() === 'draw') drawOdds = outcome.price;
          });
        }

        // Parse Totals (Over/Under) market - take the first 'totals' market found
        const totalsAPIMarket = bookie.markets.find(m => m.key === 'totals');
        if (totalsAPIMarket && totalsAPIMarket.outcomes.length >= 2) {
          // Assuming standard Over/Under for a specific point value
          // Find the first "Over" to determine the point for this market
          const firstOverOutcome = totalsAPIMarket.outcomes.find(o => o.name === 'Over' && o.point !== undefined);
          if (firstOverOutcome && firstOverOutcome.point !== undefined) {
            totalsMarketData = { point: firstOverOutcome.point };
            totalsAPIMarket.outcomes.forEach(outcome => {
              if (outcome.point === firstOverOutcome.point) { // Ensure we are looking at the same point value
                if (outcome.name === 'Over') totalsMarketData!.overOdds = outcome.price;
                else if (outcome.name === 'Under') totalsMarketData!.underOdds = outcome.price;
              }
            });
          }
        }
      }

      return {
        id: match.id,
        sportKey: match.sport_key, // Include sportKey
        sportTitle: match.sport_title,
        commenceTime: match.commence_time,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        bookmakerTitle,
        homeWinOdds,
        awayWinOdds,
        drawOdds,
        totalsMarket: totalsMarketData,
      };
    });

    return NextResponse.json(simplifiedMatches);

  } catch (error: any) {
    console.error('Error in API Route fetching/processing sports odds:', error);
    return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
  }
}
