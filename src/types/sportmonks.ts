export interface SportmonksParticipant {
    id: number;
    sport_id: number;
    country_id: number;
    venue_id: number;
    gender: string;
    name: string;
    short_code: string;
    image_path: string;
    last_played_at: string;
    meta: {
        location: 'home' | 'away';
    };
}

export interface SportmonksScore {
    id: number;
    fixture_id: number;
    type_id: number;
    participant_id: number;
    score: {
        goals: number;
        participant: 'home' | 'away';
    };
    description: string;
}

export interface SportmonksLeague {
    id: number;
    name: string;
    country: {
        id: number;
        name: string;
    }
}

export interface SportmonksLiveScore {
    id: number;
    name: string; // e.g. "Team A vs Team B"
    starting_at: string;
    league: SportmonksLeague;
    participants: SportmonksParticipant[];
    scores: SportmonksScore[];
    periods: any[]; // define if needed
    events: any[]; // define if needed
}

export interface SportmonksResponse {
    data: SportmonksLiveScore[];
    // pagination etc. if needed
}

// Simplified structure for our component
export interface ProcessedLiveScore {
    id: number;
    name: string;
    homeTeam: { name: string; score: number };
    awayTeam: { name: string; score: number };
    leagueName: string;
    countryName: string;
    startTime: string;
}
