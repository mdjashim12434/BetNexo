import type { 
    SportmonksV3Fixture,
    ProcessedFixture, 
    SportmonksState,
    FootballEvent,
} from '@/types/sportmonks';

// This function is now a pure utility and can be used on both server and client if needed.
// It no longer contains any fetching logic itself.

// --- Centralized State Definitions ---
const LIVE_STATES_V3: string[] = ['LIVE', 'HT', 'ET', 'PEN_LIVE', 'BREAK', 'INT'];
// Corrected to only include states that definitively mean a match is over.
const FINISHED_STATES_V3: string[] = ['FT', 'AET', 'Finished', 'AWARDED', 'WO', 'DELETED'];

// Helper to robustly parse date strings
const parseSportmonksDateStringToISO = (dateString: string): string => {
    if (!dateString) return new Date().toISOString();
    // Handles dates like "2024-07-13 00:00:00"
    const isoString = dateString.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};


// --- V3 Football Data Processor ---
export const processV3FootballFixtures = (fixtures: SportmonksV3Fixture[]): ProcessedFixture[] => {
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
            if (isFinished && state.name !== 'Finished') return { text: state.name, isGoal: false };
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

// --- CLIENT-SIDE Fetching Functions (call internal API routes) ---
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.API_BASE_URL || 'http://localhost:9002';
  }
  return '';
};

const handleApiResponse = async (response: Response) => {
    if (response.ok) return response.json();
    const errorJson = await response.json().catch(() => ({}));
    const apiMessage = errorJson.error || 'The API did not provide a specific error message.';
    throw new Error(apiMessage);
};

export async function fetchLiveFootballFixtures(leagueId?: number, firstPageOnly = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/live-scores?leagueId=${leagueId}` : '/api/football/live-scores';
    if (firstPageOnly) {
        path += path.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const url = `${getApiBaseUrl()}${path}`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await handleApiResponse(response);
    return processV3FootballFixtures(data?.data || []);
}

export async function fetchUpcomingFootballFixtures(leagueId?: number, firstPageOnly = false): Promise<ProcessedFixture[]> {
    let path = leagueId ? `/api/football/upcoming-fixtures?leagueId=${leagueId}` : '/api/football/upcoming-fixtures';
     if (firstPageOnly) {
        path += path.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const url = `${getApiBaseUrl()}${path}`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await handleApiResponse(response);
    return processV3FootballFixtures(data?.data || []);
}

export async function fetchFixtureDetails(fixtureId: number): Promise<ProcessedFixture> {
    const url = `${getApiBaseUrl()}/api/football/fixtures?fixtureId=${fixtureId}`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await handleApiResponse(response);
    const processed = processV3FootballFixtures([data.data]);
    if (!processed || processed.length === 0) {
        throw new Error(`Could not process fixture details for ID ${fixtureId}.`);
    }
    return processed[0];
}

export async function fetchTodaysFootballFixtures(): Promise<ProcessedFixture[]> {
    const url = `${getApiBaseUrl()}/api/football/todays-fixtures`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await handleApiResponse(response);
    return processV3FootballFixtures(data?.data || []);
}
