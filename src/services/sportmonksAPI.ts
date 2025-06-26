
import type { 
    ProcessedLiveScore, 
    SportmonksOddsFixture, 
    SportmonksFootballFixturesResponse,
    ProcessedFixture, 
    SportmonksSingleFixtureResponse, 
    CricketRun,
    SportmonksFootballLiveResponse,
    SportmonksFootballLiveScore,
    ProcessedFootballLiveScore,
    SportmonksCricketV3Fixture,
    SportmonksCricketV3FixturesResponse,
    SportmonksSingleCricketV3FixtureResponse
} from '@/types/sportmonks';

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
        case 422: userFriendlyMessage = `Unprocessable Entity: The request was well-formed but could not be processed. Details: ${apiMessage}`; break;
        case 429: userFriendlyMessage = `Too Many Requests: The hourly API limit has been reached.`; break;
        case 500: userFriendlyMessage = `Internal Server Error: The API provider encountered an error.`; break;
        default: userFriendlyMessage = `An unexpected API error occurred. Status: ${response.status}, Message: ${apiMessage}`; break;
    }
    console.error(`API Error (Status ${response.status}): ${userFriendlyMessage}`);
    throw new Error(userFriendlyMessage);
};


// --- Cricket Processing (V3) ---

const processCricketLiveScoresApiResponse = (data: SportmonksCricketV3Fixture[]): ProcessedLiveScore[] => {
    if (!Array.isArray(data)) return [];
    return data.map((match: SportmonksCricketV3Fixture) => {
        const homeTeam = match.participants?.find(p => p.meta.location === 'home');
        const awayTeam = match.participants?.find(p => p.meta.location === 'away');

        const localTeamRun = match.runs?.find(r => r.participant_id === homeTeam?.id);
        const visitorTeamRun = match.runs?.find(r => r.participant_id === awayTeam?.id);
        const formatScore = (run?: CricketRun) => run ? `${run.score}/${run.wickets} (${run.overs})` : "Yet to bat";
        
        // Using match.note as the most reliable source for a human-readable live update summary.
        const latestEventString = match.note;
        
        return {
            id: match.id,
            name: match.name || `${homeTeam?.name || 'Team 1'} vs ${awayTeam?.name || 'Team 2'}`,
            homeTeam: { name: homeTeam?.name || 'Team 1', score: formatScore(localTeamRun) },
            awayTeam: { name: awayTeam?.name || 'Team 2', score: formatScore(visitorTeamRun) },
            leagueName: match.league?.name ?? 'N/A',
            countryName: 'N/A', // V3 Fixture does not have country in league object
            startTime: match.starting_at,
            status: match.state.name,
            note: match.note,
            latestEvent: latestEventString,
        };
    });
};

const processCricketFixtureData = (fixtures: SportmonksCricketV3Fixture[]): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];
    return fixtures.map(fixture => {
        const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');

        // Cricket odds: 1 for home win, 2 for away win. No draw.
        const h2hOdds = fixture.odds?.filter(o => o.market_id === 1) || [];
        const homeOdd = h2hOdds.find(o => o.original_label === '1');
        const awayOdd = h2hOdds.find(o => o.original_label === '2');

        return {
            id: fixture.id,
            sportKey: 'cricket',
            name: fixture.name || `${homeTeam?.name || 'Team 1'} vs ${awayTeam?.name || 'Team 2'}`,
            startingAt: fixture.starting_at,
            state: fixture.state,
            league: {
                id: fixture.league?.id || 0,
                name: fixture.league?.name || 'N/A',
                countryName: 'N/A' // V3 Fixture does not have country in league object
            },
            homeTeam: { id: homeTeam?.id || 0, name: homeTeam?.name || 'Team 1', image_path: homeTeam?.image_path },
            awayTeam: { id: awayTeam?.id || 0, name: awayTeam?.name || 'Team 2', image_path: awayTeam?.image_path },
            odds: {
                home: homeOdd ? parseFloat(homeOdd.value) : undefined,
                away: awayOdd ? parseFloat(awayOdd.value) : undefined,
            },
            comments: [],
        };
    });
};

const processLiveCricketFixtures = (fixtures: SportmonksCricketV3Fixture[]): ProcessedFixture[] => {
    return processCricketFixtureData(fixtures);
};


// --- Football Processing (V3) ---

const processFootballFixtureData = (fixtures: SportmonksOddsFixture[]): ProcessedFixture[] => {
    return fixtures.map(fixture => {
        const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');
        const comments = fixture.comments?.map(comment => ({
            id: comment.id,
            comment: comment.comment,
            minute: comment.minute,
            extra_minute: comment.extra_minute,
            is_goal: comment.is_goal,
        })).sort((a, b) => b.minute - a.minute) || [];

        // H2H Odds (Market ID: 1)
        const h2hOdds = fixture.odds?.filter(o => o.market_id === 1) || [];
        const homeOdd = h2hOdds.find(o => o.original_label === '1');
        const drawOdd = h2hOdds.find(o => o.original_label === 'Draw');
        const awayOdd = h2hOdds.find(o => o.original_label === '2');

        // Over/Under 2.5 Odds (Market ID: 10, Label: '2.5')
        const overUnderOdds = fixture.odds?.filter(o => o.market_id === 10 && o.label === '2.5') || [];
        const overOdd = overUnderOdds.find(o => o.original_label === 'Over');
        const underOdd = overUnderOdds.find(o => o.original_label === 'Under');

        // BTTS Odds (Market ID: 12)
        const bttsOdds = fixture.odds?.filter(o => o.market_id === 12) || [];
        const bttsYesOdd = bttsOdds.find(o => o.original_label === 'Yes');
        const bttsNoOdd = bttsOdds.find(o => o.original_label === 'No');

        return {
            id: fixture.id,
            sportKey: 'football',
            name: fixture.name,
            startingAt: fixture.starting_at,
            state: fixture.state,
            league: { id: fixture.league_id, name: fixture.league?.name || 'N/A', countryName: fixture.league?.country?.name || 'N/A' },
            homeTeam: { id: homeTeam?.id || 0, name: homeTeam?.name || 'Home', image_path: homeTeam?.image_path },
            awayTeam: { id: awayTeam?.id || 0, name: awayTeam?.name || 'Away', image_path: awayTeam?.image_path },
            odds: {
                home: homeOdd ? parseFloat(homeOdd.value) : undefined,
                draw: drawOdd ? parseFloat(drawOdd.value) : undefined,
                away: awayOdd ? parseFloat(awayOdd.value) : undefined,
                overUnder: {
                    over: overOdd ? parseFloat(overOdd.value) : undefined,
                    under: underOdd ? parseFloat(underOdd.value) : undefined,
                    point: overOdd || underOdd ? 2.5 : undefined,
                },
                btts: {
                    yes: bttsYesOdd ? parseFloat(bttsYesOdd.value) : undefined,
                    no: bttsNoOdd ? parseFloat(bttsNoOdd.value) : undefined,
                }
            },
            comments: comments,
        };
    });
};

const processFootballLiveScoresApiResponse = (data: SportmonksFootballLiveScore[]): ProcessedFootballLiveScore[] => {
    if (!Array.isArray(data)) return [];
    return data.map(match => {
        const homeTeam = match.participants?.find(p => p.meta.location === 'home');
        const awayTeam = match.participants?.find(p => p.meta.location === 'away');
        
        const getScore = (participantId: number): number => {
            let score = match.scores?.find(s => s.participant_id === participantId && s.type_id === 16); // type_id 16 is 'current' score for football
            if (score) return score.score.goals;

            score = match.scores?.find(s => s.participant_id === participantId && s.description === 'CURRENT');
            if (score) return score.score.goals;
            
            return 0;
        };
        
        let latestEventString;
        if (match.events && match.events.length > 0) {
            const latestEvent = match.events
                .filter(e => e.type && e.type.name.toLowerCase() !== 'period start')
                .sort((a, b) => b.id - a.id)[0];
            
            if (latestEvent) {
                const participantName = latestEvent.participant?.name;
                latestEventString = `${latestEvent.minute}' - ${latestEvent.type.name}`;
                if (participantName && (latestEvent.type.name.toLowerCase().includes('goal') || latestEvent.type.name.toLowerCase().includes('card'))) {
                    latestEventString += ` (${participantName})`;
                }
            }
        }

        return {
            id: match.id,
            name: match.name,
            homeTeam: { name: homeTeam?.name ?? 'Home', score: homeTeam ? getScore(homeTeam.id) : 0 },
            awayTeam: { name: awayTeam?.name ?? 'Away', score: awayTeam ? getScore(awayTeam.id) : 0 },
            leagueName: match.league?.name || 'N/A',
            minute: match.periods?.find(p => p.ticking)?.minutes,
            status: match.state?.name || 'Live',
            latestEvent: latestEventString
        };
    });
};

const processLiveFootballFixtures = (fixtures: SportmonksFootballLiveScore[]): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];
    return fixtures.map(fixture => {
        const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');
        return {
            id: fixture.id,
            sportKey: 'football',
            name: fixture.name,
            startingAt: fixture.starting_at,
            state: fixture.state,
            league: { id: fixture.league?.id || 0, name: fixture.league?.name || 'N/A', countryName: fixture.league?.country?.name || 'N/A' },
            homeTeam: { id: homeTeam?.id || 0, name: homeTeam?.name || 'Home', image_path: homeTeam?.image_path },
            awayTeam: { id: awayTeam?.id || 0, name: awayTeam?.name || 'Away', image_path: awayTeam?.image_path },
            odds: {}, // Live football endpoint doesn't provide odds
            comments: [],
        };
    });
};


// --- Public Fetching Functions ---

export async function fetchLiveScores(): Promise<ProcessedLiveScore[]> {
    try {
        const response = await fetch('/api/cricket/live-scores');
        const responseData: SportmonksCricketV3FixturesResponse = await handleApiResponse(response);
        return processCricketLiveScoresApiResponse(responseData.data);
    } catch (error) {
        console.error('Error in fetchLiveScores (Cricket V3) service:', error);
        throw error;
    }
}

export async function fetchFootballLiveScores(): Promise<ProcessedFootballLiveScore[]> {
  try {
    const response = await fetch('/api/football/live-scores');
    const responseData: SportmonksFootballLiveResponse = await handleApiResponse(response);
    return processFootballLiveScoresApiResponse(responseData.data);
  } catch (error) {
    console.error('Error in fetchFootballLiveScores service:', error);
    throw error;
  }
}

export async function fetchLiveFootballFixtures(): Promise<ProcessedFixture[]> {
  try {
    const response = await fetch('/api/football/live-scores');
    const responseData: SportmonksFootballLiveResponse = await handleApiResponse(response);
    return processLiveFootballFixtures(responseData.data);
  } catch (error) {
    console.error('Error in fetchLiveFootballFixtures service:', error);
    throw error;
  }
}

export async function fetchLiveCricketFixtures(): Promise<ProcessedFixture[]> {
  try {
    const response = await fetch('/api/cricket/live-scores');
    const responseData: SportmonksCricketV3FixturesResponse = await handleApiResponse(response);
    return processLiveCricketFixtures(responseData.data);
  } catch (error) {
    console.error('Error in fetchLiveCricketFixtures (V3) service:', error);
    throw error;
  }
}

export async function fetchUpcomingFootballFixtures(): Promise<ProcessedFixture[]> {
    try {
        const response = await fetch('/api/football/upcoming-fixtures');
        const rawData: SportmonksFootballFixturesResponse = await handleApiResponse(response);
        return processFootballFixtureData(rawData.data);
    } catch (error) {
        console.error('Error in fetchUpcomingFootballFixtures service:', error);
        throw error;
    }
}

export async function fetchUpcomingCricketFixtures(): Promise<ProcessedFixture[]> {
    try {
        const response = await fetch('/api/cricket/upcoming-fixtures');
        const rawData: SportmonksCricketV3FixturesResponse = await handleApiResponse(response);
        return processCricketFixtureData(rawData.data);
    } catch (error) {
        console.error('Error in fetchUpcomingCricketFixtures (V3) service:', error);
        throw error;
    }
}

async function fetchFootballFixtureById(fixtureId: number): Promise<SportmonksOddsFixture> {
    try {
        const response = await fetch(`/api/football/fixtures?fixtureId=${fixtureId}`);
        const fixtureResponse: SportmonksSingleFixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchFootballFixtureById service:', error);
        throw error;
    }
}

async function fetchCricketFixtureById(fixtureId: number): Promise<SportmonksCricketV3Fixture> {
    try {
        const response = await fetch(`/api/cricket/fixtures?fixtureId=${fixtureId}`);
        const fixtureResponse: SportmonksSingleCricketV3FixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchCricketFixtureById (V3) service:', error);
        throw error;
    }
}

export async function fetchFixtureDetails(fixtureId: number, sport: 'football' | 'cricket'): Promise<ProcessedFixture> {
    try {
        if (sport === 'football') {
            const rawFixture = await fetchFootballFixtureById(fixtureId);
            return processFootballFixtureData([rawFixture])[0];
        } else if (sport === 'cricket') {
            const rawFixture = await fetchCricketFixtureById(fixtureId);
            return processCricketFixtureData([rawFixture])[0];
        }
        throw new Error(`Unsupported sport type for fetchFixtureDetails: ${sport}`);
    } catch (error) {
        console.error(`Error in fetchFixtureDetails for ${sport} ID ${fixtureId}:`, error);
        throw error;
    }
}
