
import type { 
    SportmonksV3Fixture,
    SportmonksV3FixturesResponse,
    SportmonksSingleV3FixtureResponse,
    ProcessedFixture, 
    SportmonksState,
    FootballEvent,
} from '@/types/sportmonks';


// --- Centralized State Definitions ---
const LIVE_STATES_V3: string[] = ['LIVE', 'HT', 'ET', 'PEN_LIVE', 'BREAK', 'INT'];
const FINISHED_STATES_V3: string[] = ['FT', 'AET', 'Finished', 'POSTP', 'CANCL', 'ABAN', 'SUSP', 'AWARDED', 'DELETED', 'WO', 'AU'];

// --- BASE URL for internal API calls ---
// Determines the base URL based on the execution environment (server or client).
const getApiBaseUrl = () => {
  // If running on the server, use the internal localhost URL.
  // This is for cases where API routes or Server Components call service functions.
  if (typeof window === 'undefined') {
    return process.env.API_BASE_URL || 'http://localhost:9002';
  }
  // If running on the client, use a relative path.
  // The browser will automatically use the current domain.
  return '';
};

const API_BASE_URL = getApiBaseUrl();


// Helper to generate user-friendly error messages
const handleApiResponse = async (response: Response) => {
    if (response.ok) return response.json();
    const errorJson = await response.json().catch(() => ({}));
    const apiMessage = errorJson.error || errorJson.message || 'The API did not provide a specific error message.';
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


// --- NEW ODDS FETCHING AND PROCESSING LOGIC ---

// Cache for odds to avoid hitting API rate limits frequently.
let oddsPromise: Promise<any[]> | null = null;
const fetchAllOdds = async (): Promise<any[]> => {
    if (!oddsPromise) {
        console.log("Fetching fresh odds from The Odds API...");
        const url = `${getApiBaseUrl()}/api/football/odds`;
        oddsPromise = fetch(url, { cache: 'no-store' })
            .then(handleApiResponse)
            .catch(err => {
                console.error("Failed to fetch odds from The Odds API, continuing without them.", err);
                oddsPromise = null; // Reset promise on error to allow retries
                return []; // Return empty array on failure
            });
        
        // Clear promise after 5 minutes to allow refetching
        setTimeout(() => { oddsPromise = null; }, 5 * 60 * 1000);
    }
    return oddsPromise;
};

const normalizeTeamName = (name: string): string => {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/fc|c\.f\.|afc|sc/g, '')
        .replace(/\b(u\d{2})\b/g, '') // remove u19, u21 etc.
        .replace(/[-.\s]/g, '') // remove separators
        .trim();
};

const findMatchingOdd = (fixture: SportmonksV3Fixture, allOdds: any[]): any | null => {
    const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
    const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');
    
    if (!homeTeam?.name || !awayTeam?.name || !fixture.starting_at) return null;

    const normalizedHomeName = normalizeTeamName(homeTeam.name);
    const normalizedAwayName = normalizeTeamName(awayTeam.name);
    const fixtureStartTime = new Date(parseSportmonksDateStringToISO(fixture.starting_at));

    for (const odd of allOdds) {
        const oddHomeTeam = normalizeTeamName(odd.home_team);
        const oddAwayTeam = normalizeTeamName(odd.away_team);
        const oddStartTime = new Date(odd.commence_time);

        const homeMatch = oddHomeTeam.includes(normalizedHomeName) || normalizedHomeName.includes(oddHomeTeam);
        const awayMatch = oddAwayTeam.includes(normalizedAwayName) || normalizedAwayName.includes(oddAwayTeam);
        const timeDiff = Math.abs(fixtureStartTime.getTime() - oddStartTime.getTime());
        const timeMatch = timeDiff < 4 * 60 * 60 * 1000; // 4-hour window for timezone/scheduling differences

        if (homeMatch && awayMatch && timeMatch) {
            return odd;
        }
    }
    return null;
};


// --- V3 Football Data Processor (UPDATED to include odds) ---
const processV3FootballFixtures = (fixtures: SportmonksV3Fixture[], allOdds: any[] = []): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];

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

        // --- Odds processing ---
        const matchingOdd = findMatchingOdd(fixture, allOdds);
        const processedOdds: ProcessedFixture['odds'] = {};

        if (matchingOdd && matchingOdd.bookmakers && matchingOdd.bookmakers.length > 0) {
            // Find the first bookmaker that has an h2h market
            const bookie = matchingOdd.bookmakers.find(b => b.markets.some(m => m.key === 'h2h'));
            if (bookie) {
                const h2hMarket = bookie.markets.find(m => m.key === 'h2h');
                if (h2hMarket && h2hMarket.outcomes) {
                    processedOdds.home = h2hMarket.outcomes.find(o => o.name === matchingOdd.home_team)?.price;
                    processedOdds.away = h2hMarket.outcomes.find(o => o.name === matchingOdd.away_team)?.price;
                    processedOdds.draw = h2hMarket.outcomes.find(o => o.name === 'Draw')?.price;
                }
            }
        }
        
        const findLatestEvent = (events?: FootballEvent[], comments?: any[]): {text: string, isGoal: boolean} | undefined => {
            const lastComment = (comments && comments.length > 0) ? comments[0] : null;
            if (lastComment) return { text: `${lastComment.minute}' - ${lastComment.comment}`, isGoal: lastComment.is_goal };
            const lastEvent = (events && events.length > 0) ? [...events].sort((a,b) => b.minute - a.minute)[0] : null;
            if (lastEvent) return { text: `${lastEvent.minute}' - ${lastEvent.type?.name || 'Event'}`, isGoal: lastEvent.type?.code === 'GOAL' };
            if (isLive && state.name !== 'Live') return { text: state.name, isGoal: false };
            return undefined;
        };
        
        return {
            id: fixture.id, sportKey: 'football', name: fixture.name, startingAt: parseSportmonksDateStringToISO(fixture.starting_at),
            state, isLive, isFinished,
            league: { id: fixture.league_id, name: fixture.league?.name || 'N/A', countryName: fixture.league?.country?.name || 'N/A' },
            homeTeam: { id: homeTeam?.id || 0, name: homeTeam?.name || 'Home', image_path: homeTeam?.image_path },
            awayTeam: { id: awayTeam?.id || 0, name: awayTeam?.name || 'Away', image_path: awayTeam?.image_path },
            odds: processedOdds,
            comments,
            venue: fixture.venue ? { name: fixture.venue.name, city: fixture.venue.city_name || fixture.venue.city || '' } : undefined,
            referee: fixture.referee ? { name: fixture.referee.fullname } : undefined,
            homeScore, awayScore, minute, latestEvent: findLatestEvent(fixture.events, comments),
        };
    });
};


// --- Public Fetching Functions (UPDATED) ---

export async function fetchLiveFootballFixtures(leagueId?: number, firstPageOnly: boolean = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/live-scores?leagueId=${leagueId}` : '/api/football/live-scores';
    if (firstPageOnly) {
      path += path.includes('?') ? `&firstPageOnly=true` : `?firstPageOnly=true`;
    }
    const url = `${API_BASE_URL}${path}`;
    
    const response = await fetch(url, { cache: 'no-store' });
    const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
    
    // Odds are less likely to be available for live matches from The Odds API, but we check anyway.
    const allOdds = await fetchAllOdds();
    const processedFixtures = processV3FootballFixtures(data?.data || [], allOdds);

    return processedFixtures.filter(fixture => !fixture.isFinished);
}

export async function fetchUpcomingFootballFixtures(leagueId?: number, firstPageOnly: boolean = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/upcoming-fixtures?leagueId=${leagueId}` : '/api/football/upcoming-fixtures';
    if (firstPageOnly) {
      path += path.includes('?') ? `&firstPageOnly=true` : `?firstPageOnly=true`;
    }
    const url = `${API_BASE_URL}${path}`;
    
    const response = await fetch(url, { cache: 'no-store' });
    const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
    
    // Fetch and merge odds
    const allOdds = await fetchAllOdds();
    const processed = processV3FootballFixtures(data?.data || [], allOdds);
    
    const now = new Date();
    return processed.filter(fixture => {
        const fixtureDate = new Date(fixture.startingAt);
        return fixtureDate > now && !fixture.isFinished;
    });
}

export async function fetchFixtureDetails(fixtureId: number): Promise<ProcessedFixture> {
    const url = `${API_BASE_URL}/api/football/fixtures?fixtureId=${fixtureId}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data: SportmonksSingleV3FixtureResponse = await handleApiResponse(response);

    // Fetch and merge odds
    const allOdds = await fetchAllOdds();
    const processed = processV3FootballFixtures([data.data], allOdds);
    
    if (!processed || processed.length === 0) {
        throw new Error(`Could not process fixture details for ID ${fixtureId}.`);
    }
    return processed[0];
}

export async function fetchTodaysFootballFixtures(): Promise<ProcessedFixture[]> {
    const url = `${API_BASE_URL}/api/football/todays-fixtures`;
    
    const response = await fetch(url, { cache: 'no-store' });
    const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
    
    // Fetch and merge odds
    const allOdds = await fetchAllOdds();
    return processV3FootballFixtures(data?.data || [], allOdds);
}
