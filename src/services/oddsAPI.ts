
import type { SimplifiedMatchOdds } from '@/types/odds';

// Re-export SimplifiedMatchOdds type if components need it
export type { SimplifiedMatchOdds } from '@/types/odds';

/**
 * Fetches live or upcoming odds for a given sport by calling the internal Next.js API route.
 * @param sportKey - The key for the sport (e.g., 'upcoming_cricket', 'soccer_epl').
 * @param regions - Comma-separated list of regions (e.g., 'uk', 'us', 'eu', 'au'). Defaults to 'uk'.
 * @param markets - Comma-separated list of markets (e.g., 'h2h,totals', 'spreads'). Defaults to 'h2h,totals'.
 * @param oddsFormat - 'decimal' or 'american'. Defaults to 'decimal'.
 * @returns A promise that resolves to an array of simplified match odds.
 */
export async function fetchSportsOdds(
  sportKey: string,
  regions: string = 'uk',
  markets: string = 'h2h,totals', // Default to fetch H2H and Totals
  oddsFormat: string = 'decimal'
): Promise<SimplifiedMatchOdds[]> {
  
  const queryParams = new URLSearchParams({
    sportKey,
    regions,
    markets,
    oddsFormat,
  });

  const url = `/api/odds?${queryParams.toString()}`;
  console.log(`Calling internal API route for odds: ${url}`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error from API route" }));
      console.error(`Error from /api/odds (status ${response.status}):`, errorData.error);
      throw new Error(errorData.error || `Failed to fetch odds from API route. Status: ${response.status}`);
    }
    
    const result: SimplifiedMatchOdds[] = await response.json();
    console.log(`Internal API route /api/odds returned for ${sportKey}:`, result.length, "matches");
    return result;
  } catch (error) {
    console.error('Error calling internal /api/odds service:', error);
    throw error; // Re-throw to be caught by the calling component
  }
}
