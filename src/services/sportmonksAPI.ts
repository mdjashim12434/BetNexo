
import type { 
    SportmonksV3Fixture,
    SportmonksV3FixturesResponse,
    SportmonksSingleV3FixtureResponse,
    ProcessedFixture, 
    SportmonksState,
    SportmonksOdd,
    FootballEvent,
} from '@/types/sportmonks';

// --- NEW: The Odds API Types ---
interface TheOddsApiBookmaker {
  key: string;
  title: string;
  markets: {
    key: 'h2h' | 'totals' | 'spreads';
    outcomes: {
      name: string; // Team name or "Draw", "Over", "Under"
      price: number;
      point?: number;
    }[];
  }[];
}
interface TheOddsApiOdd {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: TheOddsApiBookmaker[];
}


// --- Centralized State Definitions ---
const LIVE_STATES_V3: string[] = ['LIVE', 'HT', 'ET', 'PEN_LIVE', 'BREAK', 'INT'];
const FINISHED_STATES_V3: string[] = ['FT', 'AET', 'Finished', 'POSTP', 'CANCL', 'ABAN', 'SUSP', 'AWARDED', 'DELETED', 'WO', 'AU'];

// --- BASE URL for internal API calls ---
// Use a relative path for all fetch calls. Next.js's fetch can handle this
// on both server and client, preventing the self-calling deadlock on server start.
const API_BASE_URL = '';

// Helper to generate user-friendly error messages
const handleApiResponse = async (response: Response) => {
    if (response.ok) return response.json();
    const errorJson = await response.json().catch(() => ({}));
    const apiMessage = errorJson.message || 'The API did not provide a specific error message.';
    let userFriendlyMessage: string;
    switch (response.status) {
        case 401: userFriendlyMessage = `Authentication Failed: The API key is likely invalid or missing.`; break;
        case 403: userFriendlyMessage = `Forbidden: Your current API plan does not allow access to this data.`; break;
        case 404: userFriendlyMessage = `Not Found: The requested match or endpoint could not be found.`; break;
        case 422: userFriendlyMessage = `Unprocessable Content: The API request had invalid parameters (e.g., bad date format).`; break;
        case 400: userFriendlyMessage = `Bad Request: The API request was malformed. Check parameters.`; break;
        case 429: userFriendlyMessage = `Too Many Requests: The hourly API limit has been reached.`; break;
        default: userFriendlyMessage = `An unexpected API error occurred. Status: ${response.status}, Message: ${apiMessage}`; break;
    }
    console.error(`API Error (Status ${response.status}): ${userFriendlyMessage}`);
    throw new Error(userFriendlyMessage);
};

// Helper to robustly parse date strings
const parseSportmonksDateStringToISO = (dateString: string): string => {
    if (!dateString) return new Date().toISOString();
    const isoString = dateString.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};


// --- NEW: Function to fetch odds from The Odds API via our proxy ---
async function fetchTheOddsApiData(): Promise<TheOddsApiOdd[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/football/odds`, { cache: 'no-store' });
    // Using no-store because odds change frequently
    return handleApiResponse(response);
  } catch (error) {
    console.error("Failed to fetch data from The Odds API proxy:", error);
    // Return empty array on failure so it doesn't break fixture display
    return [];
  }
}


// --- MODIFIED: V3 Football Data Processor to merge odds ---
const processV3FootballFixtures = (fixtures: SportmonksV3Fixture[], theOddsApiData: TheOddsApiOdd[] = []): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];

    // More robust normalization for team names to handle special characters
    const normalizeTeamName = (name: string) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Removes diacritics (e.g., á -> a)
            .replace(/&/g, 'and')
            .replace(/[.,]/g, '')
            .replace(/\s(fc|afc|sc|cf)$/, '')
            .trim();
    };

    return fixtures.map(fixture => {
        const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');
        const state = fixture.state || { id: 0, state: 'NS', name: 'Not Started', short_name: 'NS', developer_name: 'NOT_STARTED' };
        const isLive = LIVE_STATES_V3.includes(state.state);
        const isFinished = FINISHED_STATES_V3.includes(state.state);
        const comments = fixture.comments?.map(c => ({ ...c })).sort((a, b) => b.minute - a.minute) || [];
        const homeScore = fixture.scores?.find(s => s.participant_id === homeTeam?.id && s.description === 'CURRENT')?.score.goals || 0;
        const awayScore = fixture.scores?.find(s => s.participant_id === awayTeam?.id && s.description === 'CURRENT')?.score.goals || 0;
        const minute = fixture.periods?.find(p => p.ticking)?.minutes;

        const findLatestEvent = (events?: FootballEvent[], comments?: any[]): {text: string, isGoal: boolean} | undefined => {
            const lastComment = (comments && comments.length > 0) ? comments[0] : null;
            if (lastComment) return { text: `${lastComment.minute}' - ${lastComment.comment}`, isGoal: lastComment.is_goal };
            const lastEvent = (events && events.length > 0) ? [...events].sort((a,b) => b.minute - a.minute)[0] : null;
            if (lastEvent) return { text: `${lastEvent.minute}' - ${lastEvent.type?.name || 'Event'}`, isGoal: lastEvent.type?.code === 'GOAL' };
            if (isLive && state.name !== 'Live') return { text: state.name, isGoal: false };
            return undefined;
        };
        
        const fixtureTime = new Date(parseSportmonksDateStringToISO(fixture.starting_at));

        // Find a matching odd from The Odds API data using team names and start time
        const matchedOdd = theOddsApiData.find(odd => {
          const smHomeName = normalizeTeamName(homeTeam?.name || '');
          const smAwayName = normalizeTeamName(awayTeam?.name || '');
          const oddsHomeName = normalizeTeamName(odd.home_team);
          const oddsAwayName = normalizeTeamName(odd.away_team);
          
          const namesMatch = smHomeName === oddsHomeName && smAwayName === oddsAwayName;
          
          if (!namesMatch) {
            return false;
          }

          // Compare time up to the minute to avoid mismatches due to seconds
          const smStartTime = fixtureTime.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
          const oddsStartTime = new Date(odd.commence_time).toISOString().slice(0, 16);
          const timeMatches = smStartTime === oddsStartTime;
          
          return timeMatches;
        });
        
        let finalOdds: ProcessedFixture['odds'] = {};

        // If a match from The Odds API is found, populate odds from it
        if (matchedOdd) {
          const bookmaker = matchedOdd.bookmakers?.[0]; // Take the first available bookmaker
          if (bookmaker) {
            const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
            if (h2hMarket) {
              finalOdds.home = h2hMarket.outcomes.find(o => normalizeTeamName(o.name) === normalizeTeamName(matchedOdd.home_team))?.price;
              finalOdds.away = h2hMarket.outcomes.find(o => normalizeTeamName(o.name) === normalizeTeamName(matchedOdd.away_team))?.price;
              finalOdds.draw = h2hMarket.outcomes.find(o => o.name === 'Draw')?.price;
            }

            const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
            if (totalsMarket) {
              const over = totalsMarket.outcomes.find(o => o.name === 'Over');
              const under = totalsMarket.outcomes.find(o => o.name === 'Under');
              if (over && under) {
                  finalOdds.overUnder = {
                      over: over.price,
                      under: under.price,
                      point: over.point
                  }
              }
            }
          }
        }

        return {
            id: fixture.id, sportKey: 'football', name: fixture.name, startingAt: parseSportmonksDateStringToISO(fixture.starting_at),
            state, isLive, isFinished,
            league: { id: fixture.league_id, name: fixture.league?.name || 'N/A', countryName: fixture.league?.country?.name || 'N/A' },
            homeTeam: { id: homeTeam?.id || 0, name: homeTeam?.name || 'Home', image_path: homeTeam?.image_path },
            awayTeam: { id: awayTeam?.id || 0, name: awayTeam?.name || 'Away', image_path: awayTeam?.image_path },
            odds: finalOdds,
            comments,
            venue: fixture.venue ? { name: fixture.venue.name, city: fixture.venue.city_name || fixture.venue.city || '' } : undefined,
            referee: fixture.referee ? { name: fixture.referee.fullname } : undefined,
            homeScore, awayScore, minute, latestEvent: findLatestEvent(fixture.events, comments),
        };
    });
};


// --- Public Fetching Functions ---

export async function fetchLiveFootballFixtures(leagueId?: number, firstPageOnly = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/live-scores?leagueId=${leagueId}` : '/api/football/live-scores';
     if (firstPageOnly) {
        path += path.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const url = `${API_BASE_URL}${path}`;
    
    const [fixtureResult, oddsResult] = await Promise.allSettled([
      fetch(url, { cache: 'no-store' }),
      fetchTheOddsApiData()
    ]);

    if (fixtureResult.status === 'rejected') {
        throw fixtureResult.reason;
    }

    const oddsData = oddsResult.status === 'fulfilled' ? oddsResult.value : [];
    const data: SportmonksV3FixturesResponse = await handleApiResponse(fixtureResult.value);
    const processedFixtures = processV3FootballFixtures(data?.data || [], oddsData);

    // The /livescores endpoint can include recently finished matches.
    // We will explicitly filter out any match that has a finished state.
    // This is safer than only including "live" states, as we might miss some.
    return processedFixtures.filter(fixture => !fixture.isFinished);
}

export async function fetchUpcomingFootballFixtures(leagueId?: number, firstPageOnly = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/upcoming-fixtures?leagueId=${leagueId}` : '/api/football/upcoming-fixtures';
    if (firstPageOnly) {
        path += path.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const url = `${API_BASE_URL}${path}`;
    
    const [fixtureResult, oddsResult] = await Promise.allSettled([
      fetch(url, { cache: 'no-store' }),
      fetchTheOddsApiData()
    ]);

    if (fixtureResult.status === 'rejected') {
        throw fixtureResult.reason;
    }
    
    const oddsData = oddsResult.status === 'fulfilled' ? oddsResult.value : [];
    const data: SportmonksV3FixturesResponse = await handleApiResponse(fixtureResult.value);
    const processed = processV3FootballFixtures(data?.data || [], oddsData);
    
    const now = new Date();
    // Filter out any matches that are not truly upcoming by checking the start time.
    // A match is upcoming if its start time is in the future and it hasn't been finished/cancelled.
    return processed.filter(fixture => {
        const fixtureDate = new Date(fixture.startingAt);
        return fixtureDate > now && !fixture.isFinished;
    });
}

export async function fetchFixtureDetails(fixtureId: number): Promise<ProcessedFixture> {
    const url = `${API_BASE_URL}/api/football/fixtures?fixtureId=${fixtureId}`;
    const [fixtureResult, oddsResult] = await Promise.allSettled([
        fetch(url, { cache: 'no-store' }),
        fetchTheOddsApiData()
    ]);
    
    if (fixtureResult.status === 'rejected') {
        throw fixtureResult.reason;
    }
    
    const oddsData = oddsResult.status === 'fulfilled' ? oddsResult.value : [];
    const data: SportmonksSingleV3FixtureResponse = await handleApiResponse(fixtureResult.value);
    return processV3FootballFixtures([data.data], oddsData)[0];
}
