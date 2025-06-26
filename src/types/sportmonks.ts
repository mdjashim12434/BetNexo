
// --- Common Types ---
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
    market?: { id: number; name: string; };
    bookmaker?: { id: number; name: string; };
}

export interface SportmonksState {
    id: number;
    state: 'NS' | 'INPLAY' | 'HT' | 'FT' | 'ET' | 'PEN_LIVE' | 'AET' | 'BREAK' | 'POSTP' | 'CANCL' | 'ABAN' | 'SUSP' | 'AWARDED' | 'DELETED' | 'TBA' | 'WO' | 'AU' | 'Finished' | 'Live'; // Common states, added Finished/Live for cricket compatibility
    name: string;
    short_name: string;
    developer_name: string;
}

export interface CricketTeam {
    id: number;
    name: string;
    code: string;
    image_path: string;
}

export interface CricketLeague {
    id: number;
    name: string;
    code: string;
    country?: { id: number; name: string; };
}


// --- Types for Cricket API v2.0 ---

export interface CricketRun {
    fixture_id: number;
    team_id: number;
    inning: number;
    score: number;
    wickets: number;
    overs: number;
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

export interface SportmonksCricketFixture {
    id: number;
    league_id: number;
    season_id: number;
    stage_id: number;
    round: string;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
    status: 'NS' | 'Live' | 'Finished' | 'Aban.' | 'Postp.' | 'Cancelled';
    note: string;
    localteam: CricketTeam;
    visitorteam: CricketTeam;
    league?: CricketLeague;
    odds?: { data: SportmonksOdd[] };
}

export interface SportmonksCricketFixturesResponse {
    data: SportmonksCricketFixture[];
}

export interface SportmonksSingleCricketFixtureResponse {
    data: SportmonksCricketFixture;
}


// --- Types for Football API v3 ---

export interface SportmonksComment {
    id: number;
    fixture_id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

export interface SportmonksParticipant {
    id: number;
    name: string;
    image_path: string;
    meta: { location: 'home' | 'away'; };
}

export interface SportmonksOddsFixture {
    id: number;
    name: string;
    starting_at: string;
    league_id: number;
    state: SportmonksState;
    participants: SportmonksParticipant[];
    odds: SportmonksOdd[];
    league?: CricketLeague;
    comments?: SportmonksComment[];
}

export interface SportmonksFootballFixturesResponse {
    data: SportmonksOddsFixture[];
}

export interface SportmonksRoundResponse {
    data: {
        id: number;
        name: string;
        league_id: number;
        fixtures: SportmonksOddsFixture[];
        league: CricketLeague;
    }
}

export interface SportmonksSingleFixtureResponse {
    data: SportmonksOddsFixture;
}

export interface FootballScore {
    id: number;
    fixture_id: number;
    type_id: number; // e.g., 16 for current score
    participant_id: number;
    score: {
        goals: number;
    };
}

export interface FootballPeriod {
    id: number;
    fixture_id: number;
    type_id: number;
    started: number;
    ended: number;
    counts_from: number;
    ticking: boolean;
    minutes?: number; // Current minute in the period
}

export interface FootballEvent {
    id: number;
    type_id: number;
    type: {
        id: number;
        name: string;
        code: string;
    };
    minute: number;
}

export interface SportmonksFootballLiveScore {
    id: number;
    name: string;
    starting_at: string;
    league: CricketLeague;
    state: SportmonksState;
    participants: SportmonksParticipant[];
    scores: FootballScore[];
    periods: FootballPeriod[] | null;
    events: FootballEvent[];
}

export interface SportmonksFootballLiveResponse {
    data: SportmonksFootballLiveScore[];
}

export interface ProcessedFootballLiveScore {
    id: number;
    name: string;
    homeTeam: { name: string; score: number };
    awayTeam: { name: string; score: number };
    leagueName: string;
    minute?: number;
    status: string;
    latestEvent?: string;
}


// --- GENERIC PROCESSED TYPES FOR UI COMPONENTS ---

export interface ProcessedComment {
    id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

export interface ProcessedFixture {
    id: number;
    sportKey: 'football' | 'cricket';
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
