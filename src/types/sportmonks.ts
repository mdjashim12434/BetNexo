

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
    state: 'NS' | 'INPLAY' | 'HT' | 'FT' | 'ET' | 'PEN_LIVE' | 'AET' | 'BREAK' | 'POSTP' | 'CANCL' | 'ABAN' | 'SUSP' | 'AWARDED' | 'DELETED' | 'TBA' | 'WO' | 'AU' | 'Finished' | 'Live' | '1st Innings' | '2nd Innings' | 'Innings Break'; // Common states, added more cricket states
    name: string;
    short_name: string;
    developer_name: string;
}

export interface SportmonksParticipant {
    id: number;
    name: string;
    image_path: string;
    meta: { location: 'home' | 'away'; };
}

export interface CricketLeague {
    id: number;
    name: string;
    code: string;
    country?: { id: number; name: string; }; // This is present in Football league, optional in Cricket
}

export interface SportmonksVenue {
    id: number;
    name: string;
    city_name: string;
    country_name: string;
}

export interface SportmonksReferee {
    id: number;
    fullname: string;
}

export interface SportmonksOfficial {
    id: number;
    fullname: string;
    type: { name: string; };
}


// --- Types for Cricket API v3 ---

export interface CricketRun {
    fixture_id: number;
    participant_id: number; // Changed from team_id
    inning: number;
    score: number;
    wickets: number;
    overs: number;
}

export interface SportmonksCricketV3Fixture {
    id: number;
    name: string;
    league_id: number;
    season_id: number;
    stage_id: number;
    round: string;
    starting_at: string;
    state: SportmonksState;
    note: string;
    participants: SportmonksParticipant[];
    league?: CricketLeague;
    runs?: CricketRun[];
    odds?: SportmonksOdd[];
    scores?: FootballScore[];
    events?: FootballEvent[];
    venue?: SportmonksVenue;
    officials?: SportmonksOfficial[];
}

export interface SportmonksCricketV3FixturesResponse {
    data: SportmonksCricketV3Fixture[];
}

export interface SportmonksSingleCricketV3FixtureResponse {
    data: SportmonksCricketV3Fixture;
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
    venue?: SportmonksVenue;
    referee?: SportmonksReferee;
}

export interface SportmonksFootballFixturesResponse {
    data: SportmonksOddsFixture[];
}

export interface SportmonksSingleFixtureResponse {
    data: SportmonksOddsFixture;
}

export interface FootballScore {
    id: number;
    fixture_id: number;
    type_id: number;
    participant_id: number;
    score: {
        goals: number;
        participant?: 'home' | 'away';
    };
    description: string;
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
    participant?: SportmonksParticipant;
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


// --- PROCESSED TYPES FOR UI COMPONENTS ---

// Processed type for homepage live cricket scores
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
    latestEvent?: string;
}

// Processed type for homepage live football scores
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

export interface ProcessedComment {
    id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

// Generic processed type for match cards and match detail pages
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
        overUnder?: {
            over?: number;
            under?: number;
            point?: number;
        };
        btts?: {
            yes?: number;
            no?: number;
        };
    };
    comments?: ProcessedComment[];
    venue?: { name: string; city: string; };
    referee?: { name: string; };
}
