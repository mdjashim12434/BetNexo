'use server';
/**
 * @fileOverview A Genkit flow to fetch sports odds from The Odds API.
 *
 * - fetchOddsViaFlow - A function that calls The Odds API securely.
 * - FetchOddsInput - The input type for the fetchOddsViaFlow function.
 * - SimplifiedMatchOddsOutput - The return type for the fetchOddsViaFlow function.
 */

import { ai } from '@/ai/genkit';
import { z }
from 'genkit';

// IMPORTANT SECURITY NOTE: For a production environment, this API key MUST be stored
// securely as an environment variable (e.g., in Firebase Functions environment configuration)
// and accessed here via process.env.ODDS_API_KEY.
// Hardcoding API keys in source code is highly insecure for production.
// This is done for prototyping purposes ONLY.
const THE_ODDS_API_KEY = '8bcbf09a3cbb1165806511a92d145464';
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

interface MatchDataAPI {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO date string
  home_team: string;
  away_team: string;
  bookmakers: BookmakerAPI[];
}

const FetchOddsInputSchema = z.object({
  sportKey: z.string().describe('The key for the sport (e.g., upcoming_cricket, soccer_epl).'),
  regions: z.string().default('uk').describe('Comma-separated list of regions (e.g., uk, us, eu, au).'),
  markets: z.string().default('h2h').describe('Comma-separated list of markets (e.g., h2h, spreads, totals).'),
  oddsFormat: z.string().default('decimal').describe("'decimal' or 'american'."),
});
export type FetchOddsInput = z.infer<typeof FetchOddsInputSchema>;

const SimplifiedMatchOddsSchema = z.object({
  id: z.string(),
  sportTitle: z.string(),
  commenceTime: z.string().describe("ISO date string for match commencement"), // Keep as string from API, convert to Date in component
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeWinOdds: z.number().optional(),
  awayWinOdds: z.number().optional(),
  drawOdds: z.number().optional(),
  bookmakerTitle: z.string().optional(),
});
export type SimplifiedMatchOddsOutput = z.infer<typeof SimplifiedMatchOddsSchema>;

const FetchOddsOutputSchema = z.array(SimplifiedMatchOddsSchema);


const fetchOddsInternalFlow = ai.defineFlow(
  {
    name: 'fetchOddsInternalFlow',
    inputSchema: FetchOddsInputSchema,
    outputSchema: FetchOddsOutputSchema,
  },
  async (input) => {
    if (!THE_ODDS_API_KEY) {
      console.error("CRITICAL: THE_ODDS_API_KEY is missing or empty in the Genkit flow.");
      throw new Error("API_KEY for The Odds API is not configured in the backend flow.");
    }

    const url = `${ODDS_API_BASE_URL}/${input.sportKey}/odds/?apiKey=${THE_ODDS_API_KEY}&regions=${input.regions}&markets=${input.markets}&oddsFormat=${input.oddsFormat}`;
    
    // Log the URL being fetched, masking the API key for security in logs.
    const maskedUrl = url.replace(THE_ODDS_API_KEY, '********');
    console.log(`Genkit flow: Fetching odds from URL: ${maskedUrl}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from The Odds API." }));
        console.error('The Odds API HTTP error in Genkit flow:', response.status, response.statusText, errorData);
        // Construct a more detailed error message
        let apiErrorMessage = `HTTP ${response.status} ${response.statusText}`;
        if (errorData && errorData.message) {
          apiErrorMessage += ` - Message: ${errorData.message}`;
        }
        throw new Error(`Failed to fetch odds from The Odds API. ${apiErrorMessage}`);
      }
      const data: MatchDataAPI[] = await response.json();

      return data.map(match => {
        let homeWinOdds: number | undefined;
        let awayWinOdds: number | undefined;
        let drawOdds: number | undefined;
        let bookmakerTitle: string | undefined;

        if (match.bookmakers && match.bookmakers.length > 0) {
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
          commenceTime: match.commence_time, // Keep as string
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          homeWinOdds,
          awayWinOdds,
          drawOdds,
          bookmakerTitle,
        };
      });
    } catch (error) {
      console.error('Error fetching or processing sports odds in Genkit flow:', error);
      // Re-throw the original error or a new error that wraps it but is still identifiable
      if (error instanceof Error) {
        throw new Error(error.message); // Re-throw with the existing message
      }
      throw new Error('An unknown error occurred while fetching odds in the Genkit flow.');
    }
  }
);

export async function fetchOddsViaFlow(input: FetchOddsInput): Promise<SimplifiedMatchOddsOutput[]> {
  return fetchOddsInternalFlow(input);
}
