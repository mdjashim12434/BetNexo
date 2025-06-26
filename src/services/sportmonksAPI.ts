
import type { 
    SportmonksCricketResponse, 
    ProcessedLiveScore, 
    SportmonksOddsFixture, 
    SportmonksRoundResponse, 
    ProcessedFixture, 
    SportmonksSingleFixtureResponse, 
    SportmonksCricketLiveScore, 
    CricketRun,
    SportmonksCricketFixturesResponse,
    SportmonksCricketFixture,
    SportmonksSingleCricketFixtureResponse
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
    console.error(`API Error (Status ${response.status}): ${apiMessage}`);
    throw new Error(userFriendlyMessage);
};


// --- Cricket Processing ---

const processLiveScoresApiResponse = (data: any): ProcessedLiveScore[] => {
    if (!Array.isArray(data)) return [];
    return data.map((match: SportmonksCricketLiveScore) => {
        const localTeamRun = match.runs.find(r => r.team_id === match.localteam_id);
        const visitorTeamRun = match.runs.find(r => r.team_id === match.visitorteam_id);
        const formatScore = (run?: CricketRun) => run ? `${run.score}/${run.wickets} (${run.overs})` : "Yet to bat";
        return {
            id: match.id,
            name: `${match.localteam.name} vs ${match.visitorteam.name}`,
            homeTeam: { name: match.localteam.name, score: formatScore(localTeamRun) },
            awayTeam: { name: match.visitorteam.name, score: formatScore(visitorTeamRun) },
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
            name: `${fixture.localteam.name} vs ${fixture.visitorteam.name}`,
            startingAt: fixture.starting_at,
            state: { id: 0, state: fixture.status, name: fixture.status, short_name: fixture.status, developer_name: fixture.status },
            league: {
                id: fixture.league?.id || 0,
                name: fixture.league?.name || 'N/A',
                countryName: fixture.league?.country?.name || 'N/A'
            },
            homeTeam: { id: fixture.localteam.id, name: fixture.localteam.name, image_path: fixture.localteam.image_path },
            awayTeam: { id: fixture.visitorteam.id, name: fixture.visitorteam.name, image_path: fixture.visitorteam.image_path },
            odds: {
                home: homeOdd ? parseFloat(homeOdd.value) : undefined,
                away: awayOdd ? parseFloat(awayOdd.value) : undefined,
            },
            comments: [], // Comments not typically included in cricket fixture list
        };
    });
};

// --- Football Processing ---

const processFootballFixtureData = (fixtures: SportmonksOddsFixture[]): ProcessedFixture[] => {
    return fixtures.map(fixture => {
        const homeTeam = fixture.participants.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants.find(p => p.meta.location === 'away');
        const h2hOdds = fixture.odds?.filter(o => o.market_id === 1) || [];
        const homeOdd = h2hOdds.find(o => o.original_label === '1');
        const drawOdd = h2hOdds.find(o => o.original_label === 'Draw');
        const awayOdd = h2hOdds.find(o => o.original_label === '2');
        const comments = fixture.comments?.map(comment => ({
            id: comment.id,
            comment: comment.comment,
            minute: comment.minute,
            extra_minute: comment.extra_minute,
            is_goal: comment.is_goal,
        })).sort((a, b) => b.minute - a.minute) || [];

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
            },
            comments: comments,
        };
    });
};

// --- Public Fetching Functions ---

export async function fetchLiveScores(): Promise<ProcessedLiveScore[]> {
    try {
        const response = await fetch('/api/live-scores');
        const responseData: SportmonksCricketResponse = await handleApiResponse(response);
        return processLiveScoresApiResponse(responseData.data);
    } catch (error) {
        console.error('Error in fetchLiveScores service:', error);
        throw error;
    }
}

export async function fetchFootballFixturesByRound(roundId: number): Promise<ProcessedFixture[]> {
    const url = `/api/football/fixtures?roundId=${roundId}`;
    try {
        const response = await fetch(url);
        const rawData: SportmonksRoundResponse = await handleApiResponse(response);
        return processFootballFixtureData(rawData.data.fixtures);
    } catch (error) {
        console.error('Error in fetchFootballFixturesByRound:', error);
        throw error;
    }
}

export async function fetchUpcomingCricketFixtures(): Promise<ProcessedFixture[]> {
    const url = `/api/cricket/fixtures`;
    try {
        const response = await fetch(url);
        const rawData: SportmonksCricketFixturesResponse = await handleApiResponse(response);
        return processCricketFixtureData(rawData.data);
    } catch (error) {
        console.error('Error in fetchUpcomingCricketFixtures:', error);
        throw error;
    }
}

async function fetchFootballFixtureById(fixtureId: number): Promise<SportmonksOddsFixture> {
    const url = `/api/football/fixtures?fixtureId=${fixtureId}`;
    try {
        const response = await fetch(url);
        const fixtureResponse: SportmonksSingleFixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchFootballFixtureById:', error);
        throw error;
    }
}

async function fetchCricketFixtureById(fixtureId: number): Promise<SportmonksCricketFixture> {
    const url = `/api/cricket/fixtures?fixtureId=${fixtureId}`;
    try {
        const response = await fetch(url);
        const fixtureResponse: SportmonksSingleCricketFixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchCricketFixtureById:', error);
        throw error;
    }
}

export async function fetchFixtureDetails(fixtureId: number, sport: 'football' | 'cricket'): Promise<ProcessedFixture> {
    if (sport === 'football') {
        const rawFixture = await fetchFootballFixtureById(fixtureId);
        return processFootballFixtureData([rawFixture])[0];
    } else if (sport === 'cricket') {
        const rawFixture = await fetchCricketFixtureById(fixtureId);
        return processCricketFixtureData([rawFixture])[0];
    }
    throw new Error(`Unsupported sport type for fetchFixtureDetails: ${sport}`);
}
