
import type { 
    SportmonksCricketResponse, 
    ProcessedLiveScore, 
    SportmonksOddsFixture, 
    SportmonksFootballFixturesResponse,
    ProcessedFixture, 
    SportmonksSingleFixtureResponse, 
    SportmonksCricketLiveScore, 
    CricketRun,
    SportmonksCricketFixturesResponse,
    SportmonksCricketFixture,
    SportmonksSingleCricketFixtureResponse,
    SportmonksFootballLiveResponse,
    SportmonksFootballLiveScore,
    ProcessedFootballLiveScore
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
        case 429: userFriendlyMessage = `Too Many Requests: The hourly API limit has been reached.`; break;
        case 500: userFriendlyMessage = `Internal Server Error: The API provider encountered an error.`; break;
        default: userFriendlyMessage = `An unexpected API error occurred. Status: ${response.status}, Message: ${apiMessage}`; break;
    }
    console.error(`API Error (Status ${response.status}): ${userFriendlyMessage}`);
    throw new Error(userFriendlyMessage);
};


// --- Cricket Processing ---

const processCricketLiveScoresApiResponse = (data: any[]): ProcessedLiveScore[] => {
    if (!Array.isArray(data)) return [];
    return data.map((match: SportmonksCricketLiveScore) => {
        const localTeamRun = match.runs?.find(r => r.team_id === match.localteam_id);
        const visitorTeamRun = match.runs?.find(r => r.team_id === match.visitorteam_id);
        const formatScore = (run?: CricketRun) => run ? `${run.score}/${run.wickets} (${run.overs})` : "Yet to bat";
        return {
            id: match.id,
            name: `${match.localteam?.name || 'Team 1'} vs ${match.visitorteam?.name || 'Team 2'}`,
            homeTeam: { name: match.localteam?.name || 'Team 1', score: formatScore(localTeamRun) },
            awayTeam: { name: match.visitorteam?.name || 'Team 2', score: formatScore(visitorTeamRun) },
            leagueName: match.league?.name ?? 'N/A',
            countryName: match.league?.country?.name ?? 'N/A',
            startTime: match.starting_at,
            status: match.status,
            note: match.note,
        };
    });
};

const processCricketFixtureData = (fixtures: SportmonksCricketFixture[]): ProcessedFixture[] => {
    return fixtures.map(fixture => {
        // Cricket odds: 1 for home win, 2 for away win. No draw.
        const homeOdd = fixture.odds?.data.find(o => o.market_id === 1 && o.original_label === '1');
        const awayOdd = fixture.odds?.data.find(o => o.market_id === 1 && o.original_label === '2');

        return {
            id: fixture.id,
            sportKey: 'cricket',
            name: `${fixture.localteam?.name || 'Team 1'} vs ${fixture.visitorteam?.name || 'Team 2'}`,
            startingAt: fixture.starting_at,
            state: { id: 0, state: fixture.status, name: fixture.status, short_name: fixture.status, developer_name: fixture.status },
            league: {
                id: fixture.league?.id || 0,
                name: fixture.league?.name || 'N/A',
                countryName: fixture.league?.country?.name || 'N/A'
            },
            homeTeam: { id: fixture.localteam?.id || 0, name: fixture.localteam?.name || 'Team 1', image_path: fixture.localteam?.image_path },
            awayTeam: { id: fixture.visitorteam?.id || 0, name: fixture.visitorteam?.name || 'Team 2', image_path: fixture.visitorteam?.image_path },
            odds: {
                home: homeOdd ? parseFloat(homeOdd.value) : undefined,
                away: awayOdd ? parseFloat(awayOdd.value) : undefined,
            },
            comments: [],
        };
    });
};

const processLiveCricketFixtures = (fixtures: SportmonksCricketLiveScore[]): ProcessedFixture[] => {
    if (!Array.isArray(fixtures)) return [];
    return fixtures.map(fixture => ({
        id: fixture.id,
        sportKey: 'cricket',
        name: `${fixture.localteam?.name || 'Team 1'} vs ${fixture.visitorteam?.name || 'Team 2'}`,
        startingAt: fixture.starting_at,
        state: { id: 0, state: fixture.status, name: fixture.status, short_name: fixture.status, developer_name: fixture.status },
        league: { id: fixture.league?.id || 0, name: fixture.league?.name || 'N/A', countryName: fixture.league?.country?.name || 'N/A' },
        homeTeam: { id: fixture.localteam?.id || 0, name: fixture.localteam?.name || 'Team 1', image_path: fixture.localteam?.image_path },
        awayTeam: { id: fixture.visitorteam?.id || 0, name: fixture.visitorteam?.name || 'Team 2', image_path: fixture.visitorteam?.image_path },
        odds: {}, // Live cricket endpoint doesn't provide odds
        comments: [],
    }));
};


// --- Football Processing ---

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
            const score = match.scores?.find(s => s.participant_id === participantId && s.type_id === 16);
            return score?.score.goals ?? 0;
        };
        
        const latestEvent = match.events?.filter(e => e.type.name.toLowerCase() !== 'period start').sort((a, b) => b.id - a.id)[0];
        let latestEventString;
        if (latestEvent) {
            const playerName = latestEvent.participant?.name;
            latestEventString = `${latestEvent.minute}' - ${latestEvent.type.name}`;
            if (playerName && (latestEvent.type.name.toLowerCase().includes('goal') || latestEvent.type.name.toLowerCase().includes('card'))) {
                latestEventString += ` (${playerName})`;
            }
        }

        return {
            id: match.id,
            name: match.name,
            homeTeam: { name: homeTeam?.name ?? 'Home', score: homeTeam ? getScore(homeTeam.id) : 0 },
            awayTeam: { name: awayTeam?.name ?? 'Away', score: awayTeam ? getScore(awayTeam.id) : 0 },
            leagueName: match.league?.name || 'N/A',
            minute: match.periods?.find(p => p.has_timer)?.minutes,
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
        const response = await fetch('/api/live-scores'); // Cricket Live Scores Proxy
        const responseData: SportmonksCricketResponse = await handleApiResponse(response);
        return processCricketLiveScoresApiResponse(responseData.data);
    } catch (error) {
        console.error('Error in fetchLiveScores (Cricket) service:', error);
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
    const response = await fetch('/api/live-scores');
    const responseData: SportmonksCricketResponse = await handleApiResponse(response);
    return processLiveCricketFixtures(responseData.data);
  } catch (error) {
    console.error('Error in fetchLiveCricketFixtures service:', error);
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
        const rawData: SportmonksCricketFixturesResponse = await handleApiResponse(response);
        return processCricketFixtureData(rawData.data);
    } catch (error) {
        console.error('Error in fetchUpcomingCricketFixtures service:', error);
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

async function fetchCricketFixtureById(fixtureId: number): Promise<SportmonksCricketFixture> {
    try {
        const response = await fetch(`/api/cricket/fixtures?fixtureId=${fixtureId}`);
        const fixtureResponse: SportmonksSingleCricketFixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchCricketFixtureById service:', error);
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
