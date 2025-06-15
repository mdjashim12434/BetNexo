
import type { MatchDataAPI, SimplifiedMatchOdds, TotalMarketOutcome } from '@/types/odds';

// Re-export SimplifiedMatchOdds type if components need it
export type { SimplifiedMatchOdds } from '@/types/odds';

const ODDS_API_KEY = '8bcbf09a3cbb1165806511a92d145464'; // Your API Key
const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

/**
 * Fetches live or upcoming odds for a given sport by calling The Odds API directly from the client.
 * @param sportKey - The key for the sport (e.g., 'upcoming_cricket', 'soccer_epl').
 * @param regions - Comma-separated list of regions (e.g., 'uk', 'us', 'eu', 'au'). Defaults to 'uk'.
 * @param markets - Comma-separated list of markets (e.g., 'h2h,totals', 'spreads'). Defaults to 'h2h,totals'.
 * @param oddsFormat - 'decimal' or 'american'. Defaults to 'decimal'.
 * @returns A promise that resolves to an array of simplified match odds.
 */
export async function fetchSportsOdds(
  sportKey: string,
  regions: string = 'uk',
  markets: string = 'h2h,totals',
  oddsFormat: string = 'decimal'
): Promise<SimplifiedMatchOdds[]> {
  
  const queryParams = new URLSearchParams({
    apiKey: ODDS_API_KEY,
    regions,
    markets,
    oddsFormat,
  });

  const url = `${ODDS_API_BASE_URL}/${sportKey}/odds/?${queryParams.toString()}`;
  const maskedUrl = url.replace(ODDS_API_KEY, '********'); // For logging only
  console.log(`Client-side: Fetching odds from URL: ${maskedUrl}`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from The Odds API." }));
      console.error(`Error from The Odds API (status ${response.status}):`, errorData.message);
      let apiErrorMessage = `HTTP ${response.status} ${response.statusText}`;
      if (errorData && errorData.message) {
        apiErrorMessage += ` - Message: ${errorData.message}`;
      }
      throw new Error(`Failed to fetch odds from The Odds API. ${apiErrorMessage}`);
    }
    
    const data: MatchDataAPI[] = await response.json();
    console.log(`The Odds API returned for ${sportKey}:`, data.length, "matches");

    // Parse and simplify the data (logic moved from the deleted API route)
    return data.map(match => {
      let homeWinOdds: number | undefined;
      let awayWinOdds: number | undefined;
      let drawOdds: number | undefined;
      let bookmakerTitle: string | undefined;
      let totalsMarketData: TotalMarketOutcome | undefined;

      if (match.bookmakers && match.bookmakers.length > 0) {
        const bookie = match.bookmakers.find(b => ['bet365', 'unibet', 'williamhill', 'paddypower', 'ladbrokes', 'coral', 'betfair_exchange', 'betfair_sportsbook', 'draftkings', 'fanduel', 'pointsbetus'].includes(b.key.toLowerCase())) || match.bookmakers[0];
        bookmakerTitle = bookie.title;

        const h2hMarket = bookie.markets.find(m => m.key === 'h2h');
        if (h2hMarket) {
          h2hMarket.outcomes.forEach(outcome => {
            if (outcome.name === match.home_team) homeWinOdds = outcome.price;
            else if (outcome.name === match.away_team) awayWinOdds = outcome.price;
            else if (outcome.name.toLowerCase() === 'draw') drawOdds = outcome.price;
          });
        }

        const totalsAPIMarket = bookie.markets.find(m => m.key === 'totals');
        if (totalsAPIMarket && totalsAPIMarket.outcomes.length >= 2) {
          const firstOverOutcome = totalsAPIMarket.outcomes.find(o => o.name === 'Over' && o.point !== undefined);
          if (firstOverOutcome && firstOverOutcome.point !== undefined) {
            totalsMarketData = { point: firstOverOutcome.point };
            totalsAPIMarket.outcomes.forEach(outcome => {
              if (outcome.point === firstOverOutcome.point) {
                if (outcome.name === 'Over') totalsMarketData!.overOdds = outcome.price;
                else if (outcome.name === 'Under') totalsMarketData!.underOdds = outcome.price;
              }
            });
          }
        }
      }

      return {
        id: match.id,
        sportKey: match.sport_key,
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

  } catch (error) {
    console.error('Error in client-side fetchSportsOdds service:', error);
    throw error; 
  }
}
