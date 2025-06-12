
import type { FetchOddsInput, SimplifiedMatchOddsOutput } from '@/ai/flows/fetch-odds-flow';
import { fetchOddsViaFlow as callFetchOddsFlow } from '@/ai/flows/fetch-odds-flow';

// Re-export SimplifiedMatchOddsOutput type if components need it
export type { SimplifiedMatchOddsOutput as SimplifiedMatchOdds } from '@/ai/flows/fetch-odds-flow';

/**
 * Fetches live or upcoming odds for a given sport by invoking a Genkit flow.
 * @param sportKey - The key for the sport (e.g., 'upcoming_cricket', 'soccer_epl_matchday').
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
): Promise<SimplifiedMatchOddsOutput[]> {
  
  const input: FetchOddsInput = {
    sportKey,
    regions,
    markets,
    oddsFormat,
  };

  try {
    // IMPORTANT SECURITY NOTE: The API_KEY is now handled within the Genkit flow.
    // The flow itself needs to securely access the API key (e.g., from environment variables in production).
    // The key '8bcbf09a3cbb1165806511a92d145464' is hardcoded in the flow for PROTOTYPING ONLY.
    console.log(`Calling Genkit flow 'fetchOddsViaFlow' with input:`, input);
    const result = await callFetchOddsFlow(input);
    console.log(`Genkit flow 'fetchOddsViaFlow' returned:`, result);
    return result;
  } catch (error) {
    console.error('Error calling fetchOddsViaFlow from oddsAPI.ts service:', error);
    // Re-throw to be caught by the calling component, allowing UI to display error state
    throw error;
  }
}
