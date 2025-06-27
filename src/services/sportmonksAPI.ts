
import type { 
    ProcessedLiveScore, 
    SportmonksV3Fixture,
    SportmonksV3FixturesResponse,
    ProcessedFixture, 
    SportmonksSingleV3FixtureResponse,
    SportmonksFootballLiveResponse,
    SportmonksFootballLiveScore,
    SportmonksState,
    SportmonksV2Fixture,
    SportmonksV2ApiResponse,
    SportmonksSingleV2FixtureResponse,
} from '@/types/sportmonks';

// Define the base URL for API calls. For production, this should come from an environment variable.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

// --- Centralized State Definitions ---
const LIVE_STATES: SportmonksState['state'][] = [
    'INPLAY', 'HT', 'ET', 'PEN_LIVE', 'BREAK', 
    'Live', '1st Innings', '2nd Innings', 'Innings Break', 'Super Over', 'TOSS', 'DELAYED'
];
const FINISHED_STATES: SportmonksState['state'][] = [
    'FT', 'AET', 'Finished', 'POSTP', 'CANCL', 'ABAN', 'SUSP', 'AWARDED', 'DELETED', 'WO', 'AU'
];


// Helper to generate user-friendly error messages based on HTTP status
const handleApiResponse = async (response: Response) => {
    if (response.ok) {
        return response.json();
    }

    const errorJson = await response.json().catch(() => ({}));
    const apiMessage = errorJson.message || 'The API did not provide a specific error message.';

    let userFriendlyMessage: string;
    switch (response.status) {
        case 400: userFriendlyMessage = `Bad Request: The server could not understand the request. Details: ${apiMessage}`; break;
        case 401: userFriendlyMessage = `Authentication Failed: The API key is likely invalid or missing.`; break;
        case 403: userFriendlyMessage = `Forbidden: Your current API plan does not allow access to this data.`; break;
        case 404: userFriendlyMessage = `Not Found: The requested match or endpoint could not be found. Details: ${apiMessage}`; break;
        case 422: userFriendlyMessage = `Unprocessable Entity: The request was well-formed but could not be processed. Details: ${apiMessage}`; break;
        case 429: userFriendlyMessage = `Too Many Requests: The hourly API limit has been reached.`; break;
        case 500: userFriendlyMessage = `Internal Server Error: The API provider encountered an error.`; break;
        default: userFriendlyMessage = `An unexpected API error occurred. Status: ${response.status}, Message: ${apiMessage}`; break;
    }
    console.error(`API Error (Status ${response.status}): ${userFriendlyMessage}`);
    throw new Error(userFriendlyMessage);
};

// Helper function to robustly parse date strings from the API into a standard ISO format.
const parseSportmonksDateStringToISO = (dateString: string): string => {
    if (!dateString) {
        return new Date().toISOString();
    }
    // Handles formats like "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS"
    const normalizedDateString = dateString.replace(' ', 'T');
    const finalDateString = normalizedDateString.endsWith('Z') ? normalizedDateString : normalizedDateString + 'Z';
    const date = new Date(finalDateString);

    if (isNaN(date.getTime())) {
        console.warn(`Could not parse date string: '${dateString}'. Using current time as fallback.`);
        return new Date().toISOString();
    }
    return date.toISOString();
};


// --- V2 Cricket Processor ---
const processCricketV2ApiResponse = (fixtures: SportmonksV2Fixture[]): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];
    return fixtures.map((fixture: SportmonksV2Fixture) => {
        let homeOddValue: number | undefined;
        let awayOddValue: number | undefined;
        
        const preMatchOdds = fixture.odds?.data?.find(o => o.name === '2-Way');
        if (preMatchOdds && preMatchOdds.bookmaker?.data?.length > 0) {
            const bookmaker = preMatchOdds.bookmaker?.data?.[0];
            if (bookmaker?.odds?.data) {
                const homeOdd = bookmaker.odds.data.find(o => o.label === '1');
                const awayOdd = bookmaker.odds.data.find(o => o.label === '2');
                homeOddValue = homeOdd ? parseFloat(homeOdd.value) : undefined;
                awayOddValue = awayOdd ? parseFloat(awayOdd.value) : undefined;
            }
        }
        
        const state: SportmonksState = {
            id: 0, 
            state: fixture.status as SportmonksState['state'], 
            name: fixture.note || fixture.status,
            short_name: fixture.status,
            developer_name: (fixture.status || 'NS').toUpperCase(),
        };

        const isLive = LIVE_STATES.includes(state.state);
        const isFinished = FINISHED_STATES.includes(state.state);

        let homeScore: string | number | undefined;
        let awayScore: string | number | undefined;

        if (isLive || isFinished) {
            const formatScore = (teamId: number) => {
                 if (!fixture.runs || fixture.runs.length === 0) return "0/0 (0.0)";
                 const teamRuns = fixture.runs.filter(r => r.team_id === teamId).sort((a,b) => b.inning - a.inning);
                 if (teamRuns.length === 0) return "Yet to bat";
                 const latestInning = teamRuns[0];
                 return `${latestInning.score}/${latestInning.wickets} (${latestInning.overs})`;
            };
            if (fixture.localteam?.id) homeScore = formatScore(fixture.localteam.id);
            if (fixture.visitorteam?.id) awayScore = formatScore(fixture.visitorteam.id);
        }

        const isoStartingAt = parseSportmonksDateStringToISO(fixture.starting_at);
        const homeTeamName = fixture.localteam?.name || 'Home';
        const awayTeamName = fixture.visitorteam?.name || 'Away';

        return {
            id: fixture.id,
            sportKey: 'cricket',
            name: `${homeTeamName} vs ${awayTeamName}`,
            startingAt: isoStartingAt,
            state: state,
            isLive: isLive,
            isFinished: isFinished,
            league: {
                id: fixture.league?.id || 0,
                name: fixture.league?.name || 'N/A',
                countryName: fixture.league?.country?.name || 'N/A'
            },
            homeTeam: { id: fixture.localteam?.id || 0, name: homeTeamName, image_path: fixture.localteam?.image_path },
            awayTeam: { id: fixture.visitorteam?.id || 0, name: awayTeamName, image_path: fixture.visitorteam?.image_path },
            odds: { home: homeOddValue, away: awayOddValue },
            comments: fixture.comments?.data?.map(c => ({...c})),
            venue: fixture.venue ? { name: fixture.venue.name, city: fixture.venue.city || '' } : undefined,
            referee: fixture.officials?.data?.[0] ? { name: fixture.officials.data[0].fullname } : undefined,
            homeScore: homeScore,
            awayScore: awayScore,
            latestEvent: fixture.note,
        };
    });
};


// --- Football & V3 Cricket Processing (V3) ---

const processV3FixtureData = (fixtures: SportmonksV3Fixture[], sportKey: 'football' | 'cricket'): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];
    return fixtures.map(fixture => {
        const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');
        
        const isLive = LIVE_STATES.includes(fixture.state.state);
        const isFinished = FINISHED_STATES.includes(fixture.state.state);
        
        const comments = fixture.comments?.map(comment => ({
            id: comment.id,
            comment: comment.comment,
            minute: comment.minute,
            extra_minute: comment.extra_minute,
            is_goal: comment.is_goal,
        })).sort((a, b) => b.minute - a.minute) || [];

        const h2hOdds = fixture.odds?.filter(o => o.market_id === 1) || [];
        const homeOdd = h2hOdds.find(o => o.original_label === '1');
        const drawOdd = h2hOdds.find(o => o.original_label === 'Draw');
        const awayOdd = h2hOdds.find(o => o.original_label === '2');
        const overUnderOdds = fixture.odds?.filter(o => o.market_id === 10 && o.label === '2.5') || [];
        const overOdd = overUnderOdds.find(o => o.original_label === 'Over');
        const underOdd = overUnderOdds.find(o => o.original_label === 'Under');
        const bttsOdds = fixture.odds?.filter(o => o.market_id === 12) || [];
        const bttsYesOdd = bttsOdds.find(o => o.original_label === 'Yes');
        const bttsNoOdd = bttsOdds.find(o => o.original_label === 'No');
        const dnbOdds = fixture.odds?.filter(o => o.market_id === 8) || [];
        const dnbHomeOdd = dnbOdds.find(o => o.original_label === '1');
        const dnbAwayOdd = dnbOdds.find(o => o.original_label === '2');
        const dcOdds = fixture.odds?.filter(o => o.market_id === 9) || [];
        const dc1XOdd = dcOdds.find(o => o.original_label === '1X');
        const dcX2Odd = dcOdds.find(o => o.original_label === 'X2');
        const dc12Odd = dcOdds.find(o => o.original_label === '12');

        let mainOfficialName: string | undefined;
        if (fixture.referee) mainOfficialName = fixture.referee.fullname;
        else if (fixture.officials?.data) {
             const umpire = fixture.officials.data.find(o => o.type.name === 'Umpire');
             if (umpire) mainOfficialName = umpire.fullname;
        }

        let homeScore: string | number | undefined;
        let awayScore: string | number | undefined;
        let minute: number | undefined;
        let latestEvent: string | undefined;

        if (isLive || isFinished) {
            if (sportKey === 'football') {
                const getScore = (participantId: number): number => {
                    const score = fixture.scores?.find(s => s.participant_id === participantId && s.description === 'CURRENT');
                    return score ? score.score.goals : 0;
                };
                if (homeTeam) homeScore = getScore(homeTeam.id);
                if (awayTeam) awayScore = getScore(awayTeam.id);
                minute = fixture.periods?.find(p => p.ticking)?.minutes;
            } else if (sportKey === 'cricket') {
                const formatScore = (participantId?: number) => {
                    if (!participantId || !fixture.runs || fixture.runs.length === 0) return "0/0 (0.0)";
                    const participantRuns = fixture.runs.filter(r => r.participant_id === participantId).sort((a, b) => b.inning - a.inning);
                    if (participantRuns.length === 0) return "Yet to bat";
                    const currentInning = participantRuns[0];
                    return `${currentInning.score}/${currentInning.wickets} (${currentInning.overs})`;
                };
                homeScore = formatScore(homeTeam?.id);
                awayScore = formatScore(awayTeam?.id);
            }
        }
        
        if (comments.length > 0) {
            latestEvent = `${comments[0].minute}' - ${comments[0].comment}`;
        } else if (isLive) {
            latestEvent = fixture.state.name;
        }

        const isoStartingAt = parseSportmonksDateStringToISO(fixture.starting_at);

        return {
            id: fixture.id,
            sportKey: sportKey,
            name: fixture.name,
            startingAt: isoStartingAt,
            state: fixture.state,
            isLive: isLive,
            isFinished: isFinished,
            league: { id: fixture.league_id, name: fixture.league?.name || 'N/A', countryName: fixture.league?.country?.name || 'N/A' },
            homeTeam: { id: homeTeam?.id || 0, name: homeTeam?.name || 'Home', image_path: homeTeam?.image_path },
            awayTeam: { id: awayTeam?.id || 0, name: awayTeam?.name || 'Away', image_path: awayTeam?.image_path },
            odds: {
                home: homeOdd ? parseFloat(homeOdd.value) : undefined,
                draw: drawOdd ? parseFloat(drawOdd.value) : undefined,
                away: awayOdd ? parseFloat(awayOdd.value) : undefined,
                overUnder: { over: overOdd ? parseFloat(overOdd.value) : undefined, under: underOdd ? parseFloat(underOdd.value) : undefined, point: overOdd || underOdd ? 2.5 : undefined },
                btts: { yes: bttsYesOdd ? parseFloat(bttsYesOdd.value) : undefined, no: bttsNoOdd ? parseFloat(bttsNoOdd.value) : undefined },
                dnb: { home: dnbHomeOdd ? parseFloat(dnbHomeOdd.value) : undefined, away: dnbAwayOdd ? parseFloat(dnbAwayOdd.value) : undefined },
                dc: { homeOrDraw: dc1XOdd ? parseFloat(dc1XOdd.value) : undefined, awayOrDraw: dcX2Odd ? parseFloat(dcX2Odd.value) : undefined, homeOrAway: dc12Odd ? parseFloat(dc12Odd.value) : undefined }
            },
            comments: comments,
            venue: fixture.venue ? { name: fixture.venue.name, city: fixture.venue.city_name || fixture.venue.city || '' } : undefined,
            referee: mainOfficialName ? { name: mainOfficialName } : undefined,
            homeScore, awayScore, minute, latestEvent,
        };
    });
};


// --- Public Fetching Functions ---

export async function fetchLiveFootballFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
  try {
    const url = leagueId ? `/api/football/live-scores?leagueId=${leagueId}` : '/api/football/live-scores';
    const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
    const responseData: SportmonksV3FixturesResponse = await handleApiResponse(response);
    
    // The API route now returns all of today's fixtures. We process them all...
    const allTodaysFixtures = processV3FixtureData(responseData?.data || [], 'football');
    
    // ... and then filter for the ones that are actually live.
    return allTodaysFixtures.filter(fixture => fixture.isLive);
  } catch (error) {
    console.error('Error in fetchLiveFootballFixtures service:', error);
    throw error;
  }
}

export async function fetchLiveCricketFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
  try {
    const url = leagueId ? `/api/cricket/live-scores?leagueId=${leagueId}` : '/api/cricket/live-scores';
    const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
    const responseData: SportmonksV2ApiResponse = await handleApiResponse(response);

    // The API route now returns all of today's fixtures. We process them all...
    const allTodaysFixtures = processCricketV2ApiResponse(responseData?.data || []);

    // ... and then filter for the ones that are actually live.
    return allTodaysFixtures.filter(fixture => fixture.isLive);
  } catch (error) {
    console.error('Error in fetchLiveCricketFixtures (V2) service:', error);
    throw error;
  }
}

export async function fetchUpcomingFootballFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
    try {
        const url = leagueId ? `/api/football/upcoming-fixtures?leagueId=${leagueId}` : '/api/football/upcoming-fixtures';
        const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
        const rawData: SportmonksV3FixturesResponse = await handleApiResponse(response);
        return processV3FixtureData(rawData?.data || [], 'football');
    } catch (error) {
        console.error('Error in fetchUpcomingFootballFixtures service:', error);
        throw error;
    }
}

export async function fetchUpcomingCricketFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
    try {
        const url = leagueId ? `/api/cricket/upcoming-fixtures?leagueId=${leagueId}` : '/api/cricket/upcoming-fixtures';
        const response = await fetch(`${API_BASE_URL}${url}`, { cache: 'no-store' });
        const rawData: SportmonksV2ApiResponse = await handleApiResponse(response);
        return processCricketV2ApiResponse(rawData?.data || []);
    } catch (error) {
        console.error('Error in fetchUpcomingCricketFixtures (V2) service:', error);
        throw error;
    }
}

async function fetchFootballFixtureById(fixtureId: number): Promise<SportmonksV3Fixture> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/football/fixtures?fixtureId=${fixtureId}`, { cache: 'no-store' });
        const fixtureResponse: SportmonksSingleV3FixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchFootballFixtureById service:', error);
        throw error;
    }
}

async function fetchCricketFixtureById(fixtureId: number): Promise<SportmonksV2Fixture> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cricket/fixtures?fixtureId=${fixtureId}`, { cache: 'no-store' });
        const fixtureResponse: SportmonksSingleV2FixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchCricketFixtureById (V2) service:', error);
        throw error;
    }
}

export async function fetchFixtureDetails(fixtureId: number, sport: 'football' | 'cricket'): Promise<ProcessedFixture> {
    try {
        if (sport === 'football') {
            const rawFixture = await fetchFootballFixtureById(fixtureId);
            return processV3FixtureData([rawFixture], 'football')[0];
        } else if (sport === 'cricket') {
            const rawFixture = await fetchCricketFixtureById(fixtureId);
            return processCricketV2ApiResponse([rawFixture])[0];
        }
        throw new Error(`Unsupported sport type for fetchFixtureDetails: ${sport}`);
    } catch (error) {
        console.error(`Error in fetchFixtureDetails for ${sport} ID ${fixtureId}:`, error);
        throw error;
    }
}
