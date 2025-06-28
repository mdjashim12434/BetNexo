
import type { 
    SportmonksV3Fixture,
    ProcessedFixture, 
    SportmonksState,
    FootballEvent,
    SportmonksOdd,
} from '@/types/sportmonks';

// This function is now a pure utility and can be used on both server and client if needed.
// It no longer contains any fetching logic itself.

// --- Centralized State Definitions ---
const LIVE_STATES_V3: string[] = ['LIVE', 'HT', 'ET', 'PEN_LIVE', 'BREAK', 'INT'];
const FINISHED_STATES_V3: string[] = ['FT', 'AET', 'Finished', 'AWARDED', 'WO']; // Removed problematic states

// Helper to robustly parse date strings
const parseSportmonksDateStringToISO = (dateString: string): string => {
    if (!dateString) return new Date().toISOString();
    // Handles dates like "2024-07-13 00:00:00"
    const isoString = dateString.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const findOddsForMarket = (odds: SportmonksOdd[], marketId: number) => {
    return odds.find(o => o.market_id === marketId);
}

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
            if (isLive && state.name !== 'Live') return { text: state.name, isGoal: false };
            return undefined;
        };

        const processedOdds: ProcessedFixture['odds'] = {};
        const allOdds = fixture.odds || [];
        
        // Market ID: 1 = 1X2 (Match Winner)
        const matchWinnerOdds = findOddsForMarket(allOdds, 1)?.bookmaker?.data?.[0]?.odds?.data || [];
        if (matchWinnerOdds.length > 0) {
            processedOdds.home = matchWinnerOdds.find(o => o.label === '1')?.value;
            processedOdds.draw = matchWinnerOdds.find(o => o.label === 'X')?.value;
            processedOdds.away = matchWinnerOdds.find(o => o.label === '2')?.value;
        }

        // Market ID: 10 = Over/Under
        const overUnderOdds = findOddsForMarket(allOdds, 10)?.bookmaker?.data?.[0]?.odds?.data || [];
        if (overUnderOdds.length > 0) {
            const over = overUnderOdds.find(o => o.label === 'Over');
            const under = overUnderOdds.find(o => o.label === 'Under');
            if(over && under){
                processedOdds.overUnder = {
                    over: over.value,
                    under: under.value,
                    point: over.total ? parseFloat(over.total) : undefined
                };
            }
        }
        
        // Market ID: 976077 = Both Teams to Score
        const bttsOdds = findOddsForMarket(allOdds, 976077)?.bookmaker?.data?.[0]?.odds?.data || [];
        if (bttsOdds.length > 0) {
             processedOdds.btts = {
                yes: bttsOdds.find(o => o.label === 'Yes')?.value,
                no: bttsOdds.find(o => o.label === 'No')?.value
            };
        }

        // Market ID: 74 = Draw No Bet
        const dnbOdds = findOddsForMarket(allOdds, 74)?.bookmaker?.data?.[0]?.odds?.data || [];
        if (dnbOdds.length > 0) {
            processedOdds.dnb = {
                home: dnbOdds.find(o => o.label === '1')?.value,
                away: dnbOdds.find(o => o.label === '2')?.value
            };
        }

        // Market ID: 12 = Double Chance
        const dcOdds = findOddsForMarket(allOdds, 12)?.bookmaker?.data?.[0]?.odds?.data || [];
        if (dcOdds.length > 0) {
            processedOdds.dc = {
                homeOrDraw: dcOdds.find(o => o.label === '1X')?.value,
                awayOrDraw: dcOdds.find(o => o.label === 'X2')?.value,
                homeOrAway: dcOdds.find(o => o.label === '12')?.value
            };
        }

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

// New function to fetch fixture details from the client side via an API route
export async function fetchFixtureDetails(fixtureId: number): Promise<ProcessedFixture | null> {
    const res = await fetch(`/api/football/fixtures?fixtureId=${fixtureId}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch fixture details.');
    }
    const apiResult: { data: SportmonksV3Fixture } = await res.json();
    if (apiResult.data) {
        // processV3FootballFixtures expects an array
        const processedFixtures = processV3FootballFixtures([apiResult.data]);
        return processedFixtures[0] || null;
    }
    return null;
}
