
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
        const matchWinnerOddsData = findOddsForMarket(allOdds, 1);
        if (matchWinnerOddsData) {
            processedOdds.home = matchWinnerOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === '1')?.value;
            processedOdds.draw = matchWinnerOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === 'X')?.value;
            processedOdds.away = matchWinnerOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === '2')?.value;
        }

        // Market ID: 10 = Over/Under
        const overUnderOddsData = findOddsForMarket(allOdds, 10);
        if (overUnderOddsData) {
            const ouOdds = overUnderOddsData.bookmaker?.data?.[0]?.odds?.data || [];
            const over = ouOdds.find(o => o.label === 'Over');
            const under = ouOdds.find(o => o.label === 'Under');
            if(over && under){
                processedOdds.overUnder = {
                    over: over.value,
                    under: under.value,
                    point: over.total ? parseFloat(over.total) : undefined
                };
            }
        }
        
        // Market ID: 976077 = Both Teams to Score
        const bttsOddsData = findOddsForMarket(allOdds, 976077);
        if (bttsOddsData) {
             processedOdds.btts = {
                yes: bttsOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === 'Yes')?.value,
                no: bttsOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === 'No')?.value
            };
        }

        // Market ID: 74 = Draw No Bet
        const dnbOddsData = findOddsForMarket(allOdds, 74);
        if (dnbOddsData) {
            processedOdds.dnb = {
                home: dnbOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === '1')?.value,
                away: dnbOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === '2')?.value
            };
        }

        // Market ID: 12 = Double Chance
        const dcOddsData = findOddsForMarket(allOdds, 12);
        if (dcOddsData) {
            processedOdds.dc = {
                homeOrDraw: dcOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === '1X')?.value,
                awayOrDraw: dcOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === 'X2')?.value,
                homeOrAway: dcOddsData.bookmaker?.data?.[0]?.odds?.data.find(o => o.label === '12')?.value
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
