import type { SportmonksResponse, SportmonksLiveScore, ProcessedLiveScore } from '@/types/sportmonks';

const SPORTMONKS_API_KEY = 'wBdgpfNzldWhiDQfTrMEuMlHUU1BhjLtOJn8NSZZJscrvGRVs6qoUOIp2rVh';
const SPORTMONKS_API_BASE_URL = 'https://api.sportmonks.com/v3/football/livescores/inplay';

const processApiResponse = (data: SportmonksLiveScore[]): ProcessedLiveScore[] => {
    return data.map(match => {
        const homeParticipant = match.participants.find(p => p.meta.location === 'home');
        const awayParticipant = match.participants.find(p => p.meta.location === 'away');

        const homeScoreObj = match.scores.find(s => s.participant_id === homeParticipant?.id && s.description === 'CURRENT');
        const awayScoreObj = match.scores.find(s => s.participant_id === awayParticipant?.id && s.description === 'CURRENT');

        const homeScore = homeScoreObj ? homeScoreObj.score.goals : 0;
        const awayScore = awayScoreObj ? awayScoreObj.score.goals : 0;

        return {
            id: match.id,
            name: match.name,
            homeTeam: {
                name: homeParticipant?.name ?? 'Home Team',
                score: homeScore,
            },
            awayTeam: {
                name: awayParticipant?.name ?? 'Away Team',
                score: awayScore,
            },
            leagueName: match.league?.name ?? 'N/A',
            countryName: match.league?.country?.name ?? 'N/A',
            startTime: match.starting_at,
        };
    });
};

export async function fetchLiveScores(): Promise<ProcessedLiveScore[]> {
    const includes = 'participants;scores;periods;events;league.country;round';
    const url = `${SPORTMONKS_API_BASE_URL}?api_token=${SPORTMONKS_API_KEY}&include=${includes}`;

    console.log(`Client-side: Fetching live scores from Sportmonks`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from Sportmonks API." }));
            console.error(`Error from Sportmonks API (status ${response.status}):`, errorData.message || response.statusText);
            throw new Error(`Failed to fetch live scores from Sportmonks API. Status: ${response.status}`);
        }

        const data: SportmonksResponse = await response.json();
        return processApiResponse(data.data);
    } catch (error) {
        console.error('Error in fetchLiveScores service:', error);
        throw error;
    }
}
