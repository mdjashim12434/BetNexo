
import type { MatchDataAPI, SimplifiedMatchOdds, TotalMarketOutcome, BTTSMarketOutcome, DrawNoBetMarketOutcome, DoubleChanceMarketOutcome } from '@/types/odds';

// Re-export SimplifiedMatchOdds type if components need it
export type { SimplifiedMatchOdds } from '@/types/odds';

const ODDS_API_KEY = '8bcbf09a3cbb1165806511a92d145464'; // Your API Key
const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

/**
 * Fetches live or upcoming odds for a given sport by calling The Odds API directly from the client.
 * @param sportKey - The key for the sport (e.g., 'upcoming_cricket', 'soccer_epl').
 * @param regions - Comma-separated list of regions (e.g., 'uk', 'us', 'eu', 'au'). Defaults to 'uk'.
 * @param markets - Optional. Comma-separated list of markets. If not provided or empty, defaults to 'h2h,totals'.
 * @param oddsFormat - 'decimal' or 'american'. Defaults to 'decimal'.
 * @returns A promise that resolves to an array of simplified match odds.
 */
export async function fetchSportsOdds(
  sportKey: string,
  regions: string = 'uk',
  markets?: string, // Made markets optional
  oddsFormat: string = 'decimal'
): Promise<SimplifiedMatchOdds[]> {

  const effectiveMarkets = (markets && markets.trim() !== '') ? markets : 'h2h,totals';

  const queryParams = new URLSearchParams({
    apiKey: ODDS_API_KEY,
    regions,
    markets: effectiveMarkets,
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
    // console.log(`The Odds API returned for ${sportKey}:`, data.length, "matches. Raw Data sample:", data.length > 0 ? JSON.parse(JSON.stringify(data[0])) : "No data");


    return data.map(match => {
      let homeWinOdds: number | undefined;
      let awayWinOdds: number | undefined;
      let drawOdds: number | undefined;
      let bookmakerTitle: string | undefined;
      let totalsMarketData: TotalMarketOutcome | undefined;
      let bttsMarketData: BTTSMarketOutcome | undefined;
      let drawNoBetMarketData: DrawNoBetMarketOutcome | undefined;
      let doubleChanceMarketData: DoubleChanceMarketOutcome | undefined;

      if (match.bookmakers && match.bookmakers.length > 0) {
        const bookie = match.bookmakers.find(b => ['bet365', 'unibet', 'williamhill', 'paddypower', 'ladbrokes', 'coral', 'betfair_exchange', 'betfair_sportsbook', 'draftkings', 'fanduel', 'pointsbetus'].includes(b.key.toLowerCase())) || match.bookmakers[0];
        bookmakerTitle = bookie.title;

        bookie.markets.forEach(market => {
          switch (market.key) {
            case 'h2h':
              market.outcomes.forEach(outcome => {
                if (outcome.name === match.home_team) homeWinOdds = outcome.price;
                else if (outcome.name === match.away_team) awayWinOdds = outcome.price;
                else if (outcome.name.toLowerCase() === 'draw') drawOdds = outcome.price;
              });
              break;
            case 'totals':
              const firstOverOutcome = market.outcomes.find(o => o.name === 'Over' && o.point !== undefined);
              if (firstOverOutcome && firstOverOutcome.point !== undefined) {
                totalsMarketData = { point: firstOverOutcome.point };
                market.outcomes.forEach(outcome => {
                  if (outcome.point === firstOverOutcome.point) {
                    if (outcome.name === 'Over') totalsMarketData!.overOdds = outcome.price;
                    else if (outcome.name === 'Under') totalsMarketData!.underOdds = outcome.price;
                  }
                });
              }
              break;
            case 'btts':
              bttsMarketData = {};
              market.outcomes.forEach(outcome => {
                if (outcome.name.toLowerCase() === 'yes') bttsMarketData!.yesOdds = outcome.price;
                else if (outcome.name.toLowerCase() === 'no') bttsMarketData!.noOdds = outcome.price;
              });
              if (Object.keys(bttsMarketData).length === 0 || (!bttsMarketData.yesOdds && !bttsMarketData.noOdds)) bttsMarketData = undefined;
              break;
            case 'draw_no_bet':
              drawNoBetMarketData = {};
              market.outcomes.forEach(outcome => {
                if (outcome.name === match.home_team) drawNoBetMarketData!.homeOdds = outcome.price;
                else if (outcome.name === match.away_team) drawNoBetMarketData!.awayOdds = outcome.price;
              });
               if (Object.keys(drawNoBetMarketData).length === 0 || (!drawNoBetMarketData.homeOdds && !drawNoBetMarketData.awayOdds)) drawNoBetMarketData = undefined;
              break;
            case 'double_chance':
              doubleChanceMarketData = {};
              market.outcomes.forEach(outcome => {
                const nameLower = outcome.name.toLowerCase();
                const homeTeamLower = match.home_team.toLowerCase();
                const awayTeamLower = match.away_team.toLowerCase();

                if (nameLower === `${homeTeamLower} or draw`) doubleChanceMarketData!.homeOrDrawOdds = outcome.price;
                else if (nameLower === `${awayTeamLower} or draw`) doubleChanceMarketData!.awayOrDrawOdds = outcome.price;
                else if (nameLower === `${homeTeamLower} or ${awayTeamLower}`) doubleChanceMarketData!.homeOrAwayOdds = outcome.price;
                // Fallbacks for generic names from API
                else if (nameLower === 'home or draw' || nameLower === '1x') doubleChanceMarketData!.homeOrDrawOdds = outcome.price;
                else if (nameLower === 'away or draw' || nameLower === 'x2') doubleChanceMarketData!.awayOrDrawOdds = outcome.price;
                else if (nameLower === 'home or away' || nameLower === '12') doubleChanceMarketData!.homeOrAwayOdds = outcome.price;
              });
              if (Object.keys(doubleChanceMarketData).length === 0 || (!doubleChanceMarketData.homeOrDrawOdds && !doubleChanceMarketData.awayOrDrawOdds && !doubleChanceMarketData.homeOrAwayOdds)) doubleChanceMarketData = undefined;
              break;
          }
        });
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
        bttsMarket: bttsMarketData,
        drawNoBetMarket: drawNoBetMarketData,
        doubleChanceMarket: doubleChanceMarketData,
      };
    });

  } catch (error) {
    console.error('Error in client-side fetchSportsOdds service:', error);
    throw error;
  }
}

