
// Types for Live Scores
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

// Simplified structure for our live score component
export interface ProcessedLiveScore {
    id: number;
    name: string;
    homeTeam: { name: string; score: number };
    awayTeam: { name: string; score: number };
    leagueName: string;
    countryName: string;
    startTime: string;
}


// --- Types for Odds by Round ---

export interface SportmonksComment {
    id: number;
    fixture_id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

export interface SportmonksOddsParticipant {
    id: number;
    name: string;
    image_path: string;
    meta: {
        location: 'home' | 'away';
    }
}

export interface SportmonksOdd {
    id: number;
    fixture_id: number;
    market_id: number;
    bookmaker_id: number;
    label: string;
    value: string;
    winning: boolean | null;
    stopped: boolean;
    market_description: string;
    original_label: string;
    market: {
        id: number;
        name: string;
    };
    bookmaker: {
        id: number;
        name: string;
    }
}

export interface SportmonksState {
    id: number;
    state: 'NS' | 'INPLAY' | 'HT' | 'FT' | 'ET' | 'PEN_LIVE' | 'AET' | 'BREAK' | 'POSTP' | 'CANCL' | 'ABAN' | 'SUSP' | 'AWARDED' | 'DELETED' | 'TBA' | 'WO' | 'AU' | 'FINISHED'; // Common states
    name: string;
    short_name: string;
    developer_name: string;
}

export interface SportmonksOddsFixture {
    id: number;
    name: string;
    starting_at: string;
    league_id: number;
    state: SportmonksState;
    participants: SportmonksOddsParticipant[];
    odds: SportmonksOdd[];
    league?: SportmonksLeague;
    comments?: SportmonksComment[];
}

export interface SportmonksRoundResponse {
    data: {
        id: number;
        name: string;
        league_id: number;
        fixtures: SportmonksOddsFixture[];
        league: SportmonksLeague;
    }
}

export interface SportmonksSingleFixtureResponse {
    data: SportmonksOddsFixture;
}

// Simplified structure for our odds components
export interface ProcessedComment {
    id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

export interface ProcessedFixture {
    id: number;
    name: string;
    startingAt: string;
    state: SportmonksState;
    league: {
        id: number;
        name: string;
        countryName: string;
    };
    homeTeam: {
        id: number;
        name: string;
        image_path?: string;
    };
    awayTeam: {
        id: number;
        name: string;
        image_path?: string;
    };
    odds: {
        home?: number;
        draw?: number;
        away?: number;
    };
    comments?: ProcessedComment[];
}
