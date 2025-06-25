// --- Types for Cricket API v2.0 Live Scores ---

export interface CricketTeam {
    id: number;
    name: string;
    code: string;
    image_path: string;
}

export interface CricketRun {
    fixture_id: number;
    team_id: number;
    inning: number;
    score: number;
    wickets: number;
    overs: number;
}

export interface CricketLeague {
    id: number;
    name: string;
    code: string;
    country?: {
        id: number;
        name: string;
    }
}

export interface SportmonksCricketLiveScore {
    id: number;
    league_id: number;
    season_id: number;
    stage_id: number;
    round: string;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
    status: string;
    note: string;
    runs: CricketRun[];
    localteam: CricketTeam;
    visitorteam: CricketTeam;
    league: CricketLeague;
}

export interface SportmonksCricketResponse {
    data: SportmonksCricketLiveScore[];
}

// Simplified structure for our live score component, adapted for Cricket
export interface ProcessedLiveScore {
    id: number;
    name: string;
    homeTeam: { name: string; score: string }; // Score as "runs/wickets (overs)"
    awayTeam: { name: string; score: string };
    leagueName: string;
    countryName: string;
    startTime: string;
    status: string;
    note: string;
}


// --- Types for Football Odds by Round (Kept for now to avoid breaking fixture pages) ---

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
    league?: SportmonksLeague; // Note: Reusing CricketLeague type here, might need adjustment
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
