import type { SportmonksCricketResponse, ProcessedLiveScore, SportmonksOddsFixture, SportmonksRoundResponse, ProcessedFixture, SportmonksSingleFixtureResponse, SportmonksCricketLiveScore, CricketRun } from '@/types/sportmonks';

// Helper to generate user-friendly error messages based on HTTP status
const handleApiResponse = async (response: Response) => {
    if (response.ok) {
        return response.json();
    }

    // Try to parse error JSON, with a fallback
    const errorJson = await response.json().catch(() => ({}));
    const apiMessage = errorJson.error || errorJson.message || 'The API did not provide a specific error message.';

    let userFriendlyMessage: string;
    switch (response.status) {
        case 400:
            userFriendlyMessage = `Bad Request: The server could not understand the request. Details: ${apiMessage}`;
            break;
        case 401:
            userFriendlyMessage = `Authentication Failed: The API key is likely invalid or missing. Please check the server configuration.`;
            break;
        case 403:
            userFriendlyMessage = `Forbidden: Your current API plan does not allow access to this data.`;
            break;
        case 429:
            userFriendlyMessage = `Too Many Requests: The hourly API limit has been reached. Please try again later.`;
            break;
        case 500:
            userFriendlyMessage = `Internal Server Error: The API provider encountered an error. Please try again later.`;
            break;
        default:
            userFriendlyMessage = `An unexpected API error occurred. Status: ${response.status}, Message: ${apiMessage}`;
            break;
    }
    // Add the original status for debugging
    console.error(`API Error (Status ${response.status}): ${apiMessage}`);
    throw new Error(userFriendlyMessage);
};


const processLiveScoresApiResponse = (data: any): ProcessedLiveScore[] => {
    if (!Array.isArray(data)) {
        console.warn("Sportmonks cricket data for live scores is not an array:", data);
        return [];
    }

    return data.map((match: SportmonksCricketLiveScore) => {
        const localTeamRun = match.runs.find(r => r.team_id === match.localteam_id);
        const visitorTeamRun = match.runs.find(r => r.team_id === match.visitorteam_id);

        const formatScore = (run?: CricketRun) => {
            if (!run) return "Yet to bat";
            return `${run.score}/${run.wickets} (${run.overs})`;
        };

        return {
            id: match.id,
            // The cricket v2 API doesn't seem to have a top-level `name` field for the match itself
            name: `${match.localteam.name} vs ${match.visitorteam.name}`,
            homeTeam: {
                name: match.localteam.name,
                score: formatScore(localTeamRun),
            },
            awayTeam: {
                name: match.visitorteam.name,
                score: formatScore(visitorTeamRun),
            },
            leagueName: match.league?.name ?? 'N/A',
            countryName: match.league?.country?.name ?? 'N/A',
            startTime: match.starting_at,
            status: match.status,
            note: match.note,
        };
    });
};

export async function fetchLiveScores(): Promise<ProcessedLiveScore[]> {
    console.log(`Client-side: Fetching live scores from internal proxy API: /api/live-scores`);
    try {
        const response = await fetch('/api/live-scores');
        const responseData: SportmonksCricketResponse = await handleApiResponse(response);
        return processLiveScoresApiResponse(responseData.data);
    } catch (error) {
        console.error('Error in fetchLiveScores service:', error);
        throw error;
    }
}


export const processFixtureData = (fixtures: SportmonksOddsFixture[]): ProcessedFixture[] => {
    return fixtures.map(fixture => {
        const homeTeam = fixture.participants.find(p => p.meta.location === 'home');
        const awayTeam = fixture.participants.find(p => p.meta.location === 'away');

        const h2hOdds = fixture.odds.filter(o => o.market_id === 1); // Market ID 1 is for Full Time Result
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
            name: fixture.name,
            startingAt: fixture.starting_at,
            state: fixture.state,
            league: {
                id: fixture.league_id,
                name: fixture.league?.name || 'N/A',
                countryName: fixture.league?.country?.name || 'N/A'
            },
            homeTeam: {
                id: homeTeam?.id || 0,
                name: homeTeam?.name || 'Home',
                image_path: homeTeam?.image_path
            },
            awayTeam: {
                id: awayTeam?.id || 0,
                name: awayTeam?.name || 'Away',
                image_path: awayTeam?.image_path
            },
            odds: {
                home: homeOdd ? parseFloat(homeOdd.value) : undefined,
                draw: drawOdd ? parseFloat(drawOdd.value) : undefined,
                away: awayOdd ? parseFloat(awayOdd.value) : undefined,
            },
            comments: comments,
        };
    });
};


export async function fetchFixturesByRound(roundId: number): Promise<SportmonksRoundResponse> {
    const url = `/api/football/fixtures?roundId=${roundId}`;
    console.log(`Fetching fixtures for round: ${roundId} via proxy`);
    try {
        const response = await fetch(url);
        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error in fetchFixturesByRound:', error);
        throw error;
    }
}


export async function fetchFixtureById(fixtureId: number): Promise<SportmonksOddsFixture> {
    const url = `/api/football/fixtures?fixtureId=${fixtureId}`;
    console.log(`Fetching single fixture: ${fixtureId} via proxy`);
     try {
        const response = await fetch(url);
        const fixtureResponse: SportmonksSingleFixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchFixtureById:', error);
        throw error;
    }
}
