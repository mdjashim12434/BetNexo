
import type { 
    ProcessedLiveScore, 
    SportmonksV3Fixture,
    SportmonksV3FixturesResponse,
    ProcessedFixture, 
    SportmonksSingleV3FixtureResponse,
    SportmonksFootballLiveResponse,
    SportmonksFootballLiveScore,
    ProcessedFootballLiveScore,
    SportmonksState
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
        case 404: userFriendlyMessage = `Not Found: The requested match or endpoint could not be found. Details: ${apiMessage}`; break;
        case 422: userFriendlyMessage = `Unprocessable Entity: The request was well-formed but could not be processed. Details: ${apiMessage}`; break;
        case 429: userFriendlyMessage = `Too Many Requests: The hourly API limit has been reached.`; break;
        case 500: userFriendlyMessage = `Internal Server Error: The API provider encountered an error.`; break;
        default: userFriendlyMessage = `An unexpected API error occurred. Status: ${response.status}, Message: ${apiMessage}`; break;
    }
    console.error(`API Error (Status ${response.status}): ${userFriendlyMessage}`);
    throw new Error(userFriendlyMessage);
};


// --- Cricket V3 Live Score Processor ---
const processCricketV3LiveScoresApiResponse = (data: SportmonksV3Fixture[]): ProcessedLiveScore[] => {
    if (!Array.isArray(data)) return [];
    return data.map((match: SportmonksV3Fixture) => {
        const homeTeam = match.participants.find(p => p.meta.location === 'home');
        const awayTeam = match.participants.find(p => p.meta.location === 'away');

        const formatScore = (participantId?: number) => {
            if (!participantId || !match.runs || match.runs.length === 0) return "Yet to bat";
            // In V3, runs can be an array of innings. We'll find the latest one.
            const participantRuns = match.runs
                .filter(r => r.participant_id === participantId)
                .sort((a, b) => b.inning - a.inning);
            
            if (participantRuns.length === 0) return "Yet to bat";
            const currentInning = participantRuns[0];
            return `${currentInning.score}/${currentInning.wickets} (${currentInning.overs})`;
        };
        
        return {
            id: match.id,
            name: match.name,
            homeTeam: { name: homeTeam?.name || 'Team 1', score: formatScore(homeTeam?.id) },
            awayTeam: { name: awayTeam?.name || 'Team 2', score: formatScore(awayTeam?.id) },
            leagueName: match.league?.name ?? 'N/A',
            countryName: match.league?.country?.name || 'N/A',
            startTime: match.starting_at,
            status: match.state.name,
            note: match.state.name, // v3 doesn't have a simple 'note' field like v2
            latestEvent: match.state.name,
        };
    });
};

// --- Football & V3 Cricket Processing (V3) ---

const processV3FixtureData = (fixtures: SportmonksV3Fixture[], sportKey: 'football' | 'cricket'): ProcessedFixture[] => {
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
        
        // Draw No Bet (Market ID: 8)
        const dnbOdds = fixture.odds?.filter(o => o.market_id === 8) || [];
        const dnbHomeOdd = dnbOdds.find(o => o.original_label === '1');
        const dnbAwayOdd = dnbOdds.find(o => o.original_label === '2');

        // Double Chance (Market ID: 9)
        const dcOdds = fixture.odds?.filter(o => o.market_id === 9) || [];
        const dc1XOdd = dcOdds.find(o => o.original_label === '1X');
        const dcX2Odd = dcOdds.find(o => o.original_label === 'X2');
        const dc12Odd = dcOdds.find(o => o.original_label === '12');

        // Handle different official/referee structures
        let mainOfficialName: string | undefined;
        if (fixture.referee) { // Football V3
            mainOfficialName = fixture.referee.fullname;
        } else if (fixture.officials?.data) { // Cricket V3
             const umpire = fixture.officials.data.find(o => o.type.name === 'Umpire');
             if (umpire) mainOfficialName = umpire.fullname;
        }

        return {
            id: fixture.id,
            sportKey: sportKey,
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
                },
                dnb: {
                    home: dnbHomeOdd ? parseFloat(dnbHomeOdd.value) : undefined,
                    away: dnbAwayOdd ? parseFloat(dnbAwayOdd.value) : undefined,
                },
                dc: {
                    homeOrDraw: dc1XOdd ? parseFloat(dc1XOdd.value) : undefined,
                    awayOrDraw: dcX2Odd ? parseFloat(dcX2Odd.value) : undefined,
                    homeOrAway: dc12Odd ? parseFloat(dc12Odd.value) : undefined,
                }
            },
            comments: comments,
            venue: fixture.venue ? { name: fixture.venue.name, city: fixture.venue.city_name || fixture.venue.city || '' } : undefined,
            referee: mainOfficialName ? { name: mainOfficialName } : undefined,
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
// The fetchLiveScores function is no longer needed as the component using it has been removed.

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

export async function fetchLiveFootballFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
  try {
    const url = leagueId ? `/api/football/live-scores?leagueId=${leagueId}` : '/api/football/live-scores';
    const response = await fetch(url);
    const responseData: SportmonksFootballLiveResponse = await handleApiResponse(response);
    return processLiveFootballFixtures(responseData.data);
  } catch (error) {
    console.error('Error in fetchLiveFootballFixtures service:', error);
    throw error;
  }
}

export async function fetchLiveCricketFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
  // This function is being kept but will likely fail due to API plan.
  // The UI layer is now responsible for not calling it or handling the error.
  try {
    const url = leagueId ? `/api/cricket/live-scores?leagueId=${leagueId}` : '/api/cricket/live-scores';
    const response = await fetch(url);
    const responseData: SportmonksV3FixturesResponse = await handleApiResponse(response);
    return processV3FixtureData(responseData.data, 'cricket');
  } catch (error) {
    console.error('Error in fetchLiveCricketFixtures (V3) service:', error);
    throw error;
  }
}

export async function fetchUpcomingFootballFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
    try {
        const url = leagueId ? `/api/football/upcoming-fixtures?leagueId=${leagueId}` : '/api/football/upcoming-fixtures';
        const response = await fetch(url);
        const rawData: SportmonksV3FixturesResponse = await handleApiResponse(response);
        return processV3FixtureData(rawData.data, 'football');
    } catch (error) {
        console.error('Error in fetchUpcomingFootballFixtures service:', error);
        throw error;
    }
}

export async function fetchUpcomingCricketFixtures(leagueId?: number): Promise<ProcessedFixture[]> {
    try {
        const url = leagueId ? `/api/cricket/upcoming-fixtures?leagueId=${leagueId}` : '/api/cricket/upcoming-fixtures';
        const response = await fetch(url);
        const rawData: SportmonksV3FixturesResponse = await handleApiResponse(response);
        return processV3FixtureData(rawData.data, 'cricket');
    } catch (error) {
        console.error('Error in fetchUpcomingCricketFixtures (V3) service:', error);
        throw error;
    }
}

async function fetchFootballFixtureById(fixtureId: number): Promise<SportmonksV3Fixture> {
    try {
        const response = await fetch(`/api/football/fixtures?fixtureId=${fixtureId}`);
        const fixtureResponse: SportmonksSingleV3FixtureResponse = await handleApiResponse(response);
        return fixtureResponse.data;
    } catch (error) {
        console.error('Error in fetchFootballFixtureById service:', error);
        throw error;
    }
}

async function fetchCricketFixtureById(fixtureId: number): Promise<SportmonksV3Fixture> {
    try {
        const response = await fetch(`/api/cricket/fixtures?fixtureId=${fixtureId}`);
        const fixtureResponse: SportmonksSingleV3FixtureResponse = await handleApiResponse(response);
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
            return processV3FixtureData([rawFixture], 'football')[0];
        } else if (sport === 'cricket') {
            const rawFixture = await fetchCricketFixtureById(fixtureId);
            return processV3FixtureData([rawFixture], 'cricket')[0];
        }
        throw new Error(`Unsupported sport type for fetchFixtureDetails: ${sport}`);
    } catch (error) {
        console.error(`Error in fetchFixtureDetails for ${sport} ID ${fixtureId}:`, error);
        throw error;
    }
}
