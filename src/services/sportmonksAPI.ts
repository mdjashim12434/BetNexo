
import type { 
    SportmonksV3Fixture,
    SportmonksV3FixturesResponse,
    SportmonksSingleV3FixtureResponse,
    SportmonksV2Fixture,
    SportmonksV2FixturesResponse,
    SportmonksV2SingleFixtureResponse,
    ProcessedFixture, 
    SportmonksState,
    SportmonksOdd,
    FootballEvent,
} from '@/types/sportmonks';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

// --- Centralized State Definitions ---
const LIVE_STATES_V3: string[] = ['LIVE', 'HT', 'ET', 'PEN_LIVE', 'BREAK', 'INT'];
const FINISHED_STATES_V3: string[] = ['FT', 'AET', 'Finished', 'POSTP', 'CANCL', 'ABAN', 'SUSP', 'AWARDED', 'DELETED', 'WO', 'AU'];

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


// --- V3 Football Data Processor ---
const processV3FootballFixtures = (fixtures: SportmonksV3Fixture[]): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];
    return fixtures.map(fixture => {
        const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');
        const state = fixture.state || { id: 0, state: 'NS', name: 'Not Started', short_name: 'NS', developer_name: 'NOT_STARTED' };
        const isLive = LIVE_STATES_V3.includes(state.state);
        const isFinished = FINISHED_STATES_V3.includes(state.state);
        const comments = fixture.comments?.map(c => ({ ...c })).sort((a, b) => b.minute - a.minute) || [];

        const getBestOdd = (marketId: number, originalLabel: string, point?: string): SportmonksOdd | undefined => {
            let marketOdds = fixture.odds?.filter(o => o.market_id === marketId && o.original_label === originalLabel) || [];
            if (point) marketOdds = marketOdds.filter(o => o.label === point);
            return marketOdds.length > 0 ? marketOdds.reduce((best, current) => parseFloat(current.value) > parseFloat(best.value) ? current : best) : undefined;
        };

        const overUnderPoint = fixture.odds?.find(o => o.market_id === 10)?.label;
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
            odds: {
                home: parseFloat(getBestOdd(1, '1')?.value || '0'),
                draw: parseFloat(getBestOdd(1, 'Draw')?.value || '0'),
                away: parseFloat(getBestOdd(1, '2')?.value || '0'),
                overUnder: { over: parseFloat(getBestOdd(10, 'Over', overUnderPoint)?.value || '0'), under: parseFloat(getBestOdd(10, 'Under', overUnderPoint)?.value || '0'), point: overUnderPoint ? parseFloat(overUnderPoint) : undefined },
                btts: { yes: parseFloat(getBestOdd(12, 'Yes')?.value || '0'), no: parseFloat(getBestOdd(12, 'No')?.value || '0') },
                dnb: { home: parseFloat(getBestOdd(8, '1')?.value || '0'), away: parseFloat(getBestOdd(8, '2')?.value || '0') },
                dc: { homeOrDraw: parseFloat(getBestOdd(9, '1X')?.value || '0'), awayOrDraw: parseFloat(getBestOdd(9, 'X2')?.value || '0'), homeOrAway: parseFloat(getBestOdd(9, '12')?.value || '0') }
            },
            comments,
            venue: fixture.venue ? { name: fixture.venue.name, city: fixture.venue.city_name || fixture.venue.city || '' } : undefined,
            referee: fixture.referee ? { name: fixture.referee.fullname } : undefined,
            homeScore, awayScore, minute, latestEvent: findLatestEvent(fixture.events, comments),
        };
    });
};

// --- V2 Cricket Data Processor ---
const processV2CricketFixtures = (fixtures: SportmonksV2Fixture[]): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];
    return fixtures.map(fixture => {
        const homeTeam = fixture.localteam;
        const awayTeam = fixture.visitorteam;
        
        const state: SportmonksState = {
            id: fixture.id, // No real state ID in V2, use fixture ID
            state: fixture.status,
            name: fixture.note || fixture.status,
            short_name: fixture.status,
            developer_name: fixture.status
        };

        const isLive = fixture.live;
        const isFinished = fixture.status === 'Finished';

        const formatScore = (runs?: any[]) => {
            if (!runs || runs.length === 0) return "0/0 (0.0)";
            const currentInning = [...runs].sort((a,b) => b.inning - a.inning)[0];
            return `${currentInning.score}/${currentInning.wickets} (${currentInning.overs})`;
        };
        const homeScore = homeTeam ? formatScore(fixture.runs?.filter(r => r.team_id === homeTeam.id)) : "N/A";
        const awayScore = awayTeam ? formatScore(fixture.runs?.filter(r => r.team_id === awayTeam.id)) : "N/A";

        return {
            id: fixture.id,
            sportKey: 'cricket',
            name: `${homeTeam?.name || 'Team A'} vs ${awayTeam?.name || 'Team B'}`,
            startingAt: parseSportmonksDateStringToISO(fixture.starting_at),
            state,
            isLive,
            isFinished,
            league: { id: fixture.league_id, name: fixture.league?.data?.name || 'N/A', countryName: '' }, // V2 league has no country. Added optional chaining for safety.
            homeTeam: { id: homeTeam?.id || 0, name: homeTeam?.name || 'Home', image_path: homeTeam?.image_path },
            awayTeam: { id: awayTeam?.id || 0, name: awayTeam?.name || 'Away', image_path: awayTeam?.image_path },
            odds: {}, // V2 Cricket odds are not supported in this implementation per user request
            homeScore,
            awayScore,
        };
    });
};


// --- Public Fetching Functions ---

export async function fetchLiveFootballFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
  const url = leagueId ? `/api/football/live-scores?leagueId=${leagueId}` : '/api/football/live-scores';
  const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
  const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
  return processV3FootballFixtures(data?.data || []);
}

export async function fetchUpcomingFootballFixtures(leagueId?: number, firstPageOnly = false): Promise<ProcessedFixture[]> {
    let url = leagueId ? `/api/football/upcoming-fixtures?leagueId=${leagueId}` : '/api/football/upcoming-fixtures';
    if (firstPageOnly) {
        url += url.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
    const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
    return processV3FootballFixtures(data?.data || []);
}

export async function fetchTodaysFootballFixtures(): Promise<ProcessedFixture[]> {
  const response = await fetch(`${API_BASE_URL}/api/football/todays-fixtures`, { cache: 'no-store' });
  const data: SportmonksV3FixturesResponse = await handleApiResponse(response);
  return processV3FootballFixtures(data?.data || []);
}

export async function fetchLiveCricketFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
  const url = leagueId ? `/api/cricket/live-scores?leagueId=${leagueId}` : '/api/cricket/live-scores';
  const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
  const data: SportmonksV2FixturesResponse = await handleApiResponse(response);
  return processV2CricketFixtures(data?.data || []);
}

export async function fetchUpcomingCricketFixtures(leagueId?: number, firstPageOnly = false): Promise<ProcessedFixture[]> {
    let url = leagueId ? `/api/cricket/upcoming-fixtures?leagueId=${leagueId}` : '/api/cricket/upcoming-fixtures';
    if (firstPageOnly) {
        url += url.includes('?') ? '&firstPageOnly=true' : '?firstPageOnly=true';
    }
    const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
    const data: SportmonksV2FixturesResponse = await handleApiResponse(response);
    return processV2CricketFixtures(data?.data || []);
}

export async function fetchFixtureDetails(fixtureId: number, sport: 'football' | 'cricket'): Promise<ProcessedFixture> {
    if (sport === 'football') {
        const response = await fetch(`${API_BASE_URL}/api/football/fixtures?fixtureId=${fixtureId}`, { cache: 'no-store' });
        const data: SportmonksSingleV3FixtureResponse = await handleApiResponse(response);
        return processV3FootballFixtures([data.data])[0];
    } else if (sport === 'cricket') {
        const response = await fetch(`${API_BASE_URL}/api/cricket/fixtures?fixtureId=${fixtureId}`, { cache: 'no-store' });
        const data: SportmonksV2SingleFixtureResponse = await handleApiResponse(response);
        return processV2CricketFixtures([data.data])[0];
    }
    throw new Error(`Unsupported sport type for fetchFixtureDetails: ${sport}`);
}
