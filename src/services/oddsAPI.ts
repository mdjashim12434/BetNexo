
// WARNING: API key is exposed client-side. This is a HIGHLY INSECURE practice for production.
// In a production environment, this API call MUST be made from a backend service
// (e.g., a Next.js API route or a Genkit flow) where the API key can be stored
// securely as an environment variable and not exposed to the client browser.
const API_KEY = '8bcbf09a3cbb1165806511a92d145464';
const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

interface OutcomeOddsAPI {
  name: string;
  price: number;
}

interface MarketAPI {
  key: string;
  last_update: string; // ISO date string
  outcomes: OutcomeOddsAPI[];
}

interface BookmakerAPI {
  key: string;
  title: string;
  last_update: string; // ISO date string
  markets: MarketAPI[];
}

export interface MatchDataAPI {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO date string
  home_team: string;
  away_team: string;
  bookmakers: BookmakerAPI[];
}

// Simplified structure for display purposes
export interface SimplifiedMatchOdds {
  id: string;
  sportTitle: string;
  commenceTime: Date;
  homeTeam: string;
  awayTeam: string;
  homeWinOdds?: number;
  awayWinOdds?: number;
  drawOdds?: number;
  bookmakerTitle?: string; // Display the name of the bookmaker providing these odds
}

/**
 * Fetches live or upcoming odds for a given sport from The Odds API.
 * @param sportKey - The key for the sport (e.g., 'upcoming_cricket', 'soccer_epl_matchday').
 *                   Refer to https://the-odds-api.com/sports-odds-data/sports-apis.html for valid sport keys.
 * @param regions - Comma-separated list of regions (e.g., 'uk', 'us', 'eu', 'au'). Defaults to 'uk'.
 * @param markets - Comma-separated list of markets (e.g., 'h2h', 'spreads', 'totals'). Defaults to 'h2h'.
 * @param oddsFormat - 'decimal' or 'american'. Defaults to 'decimal'.
 * @returns A promise that resolves to an array of simplified match odds.
 */
export async function fetchSportsOdds(
  sportKey: string,
  regions: string = 'uk',
  markets: string = 'h2h',
  oddsFormat: string = 'decimal'
): Promise<SimplifiedMatchOdds[]> {
  if (!API_KEY) {
    console.error("CRITICAL: API_KEY for The Odds API is missing or empty.");
    throw new Error("API_KEY for The Odds API is not configured. This call will fail. For production, ensure this is handled securely on a backend.");
  }

  const url = `${ODDS_API_BASE_URL}/${sportKey}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to parse error response as JSON." }));
      console.error('Odds API HTTP error:', response.status, response.statusText, errorData);
      throw new Error(`Failed to fetch odds from The Odds API: ${response.status} ${response.statusText}. ${errorData.message ? `Message: ${errorData.message}` : ''}`);
    }
    const data: MatchDataAPI[] = await response.json();

    return data.map(match => {
      let homeWinOdds: number | undefined;
      let awayWinOdds: number | undefined;
      let drawOdds: number | undefined;
      let bookmakerTitle: string | undefined;

      if (match.bookmakers && match.bookmakers.length > 0) {
        // Prioritize known, reputable bookmakers or the first one if specific logic isn't needed
        const bookie = match.bookmakers[0]; // Taking the first bookmaker for simplicity
        bookmakerTitle = bookie.title;
        const h2hMarket = bookie.markets.find(m => m.key === 'h2h');
        if (h2hMarket) {
          h2hMarket.outcomes.forEach(outcome => {
            if (outcome.name === match.home_team) {
              homeWinOdds = outcome.price;
            } else if (outcome.name === match.away_team) {
              awayWinOdds = outcome.price;
            } else if (outcome.name.toLowerCase() === 'draw') {
              drawOdds = outcome.price;
            }
          });
        }
      }

      return {
        id: match.id,
        sportTitle: match.sport_title,
        commenceTime: new Date(match.commence_time),
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        homeWinOdds,
        awayWinOdds,
        drawOdds,
        bookmakerTitle,
      };
    });
  } catch (error) {
    console.error('Error fetching or processing sports odds in oddsAPI.ts:', error);
    // Re-throw to be caught by the calling component, allowing UI to display error state
    throw error;
  }
}
