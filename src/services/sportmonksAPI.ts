import type { SportmonksResponse, ProcessedLiveScore } from '@/types/sportmonks';

// TODO: Replace this with your actual Firebase Function URL after deployment
const FIREBASE_FUNCTION_URL = 'https://us-central1-summer-function-461109-t2.cloudfunctions.net/getLiveScores';

const processApiResponse = (data: any): ProcessedLiveScore[] => {
    if (!Array.isArray(data)) {
        console.warn("Sportmonks data is not an array:", data);
        return [];
    }

    return data.map(match => {
        const homeParticipant = match.participants.find((p: any) => p.meta.location === 'home');
        const awayParticipant = match.participants.find((p: any) => p.meta.location === 'away');

        const homeScoreObj = match.scores.find((s: any) => s.participant_id === homeParticipant?.id && s.description === 'CURRENT');
        const awayScoreObj = match.scores.find((s: any) => s.participant_id === awayParticipant?.id && s.description === 'CURRENT');

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
    if (!FIREBASE_FUNCTION_URL.startsWith('https://')) {
        const errorMessage = "Firebase Function URL is not configured. Please deploy the function and update the URL in src/services/sportmonksAPI.ts";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    console.log(`Client-side: Fetching live scores from Firebase Function: ${FIREBASE_FUNCTION_URL}`);

    try {
        const response = await fetch(FIREBASE_FUNCTION_URL);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error from Firebase Function (status ${response.status}):`, errorText);
            throw new Error(`Failed to fetch live scores via Firebase Function. Status: ${response.status}`);
        }

        const responseData: SportmonksResponse = await response.json();
        return processApiResponse(responseData.data);
    } catch (error) {
        console.error('Error in fetchLiveScores service:', error);
        throw error;
    }
}
