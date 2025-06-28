
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


// --- V3 Football Data Processor (simplified, without odds) ---
const processV3FootballFixtures = (fixtures: SportmonksV3Fixture[]): ProcessedFixture[] => {
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
            odds: {}, // Odds are removed for now.
            comments,
            venue: fixture.venue ? { name: fixture.venue.name, city: fixture.venue.city_name || fixture.venue.city || '' } : undefined,
            referee: fixture.referee ? { name: fixture.referee.fullname } : undefined,
            homeScore, awayScore, minute, latestEvent: findLatestEvent(fixture.events, comments),
        };
    });
};


// --- Public Fetching Functions ---

export async function fetchLiveFootballFixtures(leagueId?: number, firstPageOnly: boolean = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/live-scores?leagueId=${leagueId}` : '/api/football/live-scores';
    if (firstPageOnly) {
        path += path.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const url = `${API_BASE_URL}${path}`;
    
    const response = await fetch(url, { cache: 'no-store' });
    const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
    const processedFixtures = processV3FootballFixtures(data?.data || []);

    return processedFixtures.filter(fixture => !fixture.isFinished);
}

export async function fetchUpcomingFootballFixtures(leagueId?: number, firstPageOnly: boolean = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/upcoming-fixtures?leagueId=${leagueId}` : '/api/football/upcoming-fixtures';
    if (firstPageOnly) {
        path += path.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const url = `${API_BASE_URL}${path}`;
    
    const response = await fetch(url, { cache: 'no-store' });
    const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
    const processed = processV3FootballFixtures(data?.data || []);
    
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
    const processed = processV3FootballFixtures([data.data]);
    if (!processed || processed.length === 0) {
        throw new Error(`Could not process fixture details for ID ${fixtureId}.`);
    }
    return processed[0];
}

export async function fetchTodaysFootballFixtures(): Promise<ProcessedFixture[]> {
    const url = `${API_BASE_URL}/api/football/todays-fixtures`;
    
    const response = await fetch(url, { cache: 'no-store' });
    const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
    return processV3FootballFixtures(data?.data || []);
}
