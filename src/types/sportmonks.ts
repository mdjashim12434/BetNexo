
// --- Common Types for V3 API ---
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
    state: 'NS' | 'INPLAY' | 'HT' | 'FT' | 'ET' | 'PEN_LIVE' | 'AET' | 'BREAK' | 'POSTP' | 'CANCL' | 'ABAN' | 'SUSP' | 'AWARDED' | 'DELETED' | 'TBA' | 'WO' | 'AU' | 'Finished' | 'Live' | '1st Innings' | '2nd Innings' | 'Innings Break' | 'Cancelled' | 'TOSS' | 'DELAYED';
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

export interface SportmonksLeague {
    id: number;
    name: string;
    code?: string;
    country?: { id: number; name: string; };
}

export interface SportmonksVenue {
    id: number;
    name: string;
    city_name?: string;
    city?: string; // Fallback
    country_name?: string;
}

export interface SportmonksReferee {
    id: number;
    fullname: string;
    type?: { name: string; };
}

export interface SportmonksPagination {
    count?: number;
    per_page?: number;
    current_page?: number;
    next_page?: string | null;
    has_more: boolean;
}

export interface SportmonksComment {
    id: number;
    fixture_id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

// --- Sport-Specific V3 Types ---

export interface SportmonksV3Run {
    id: number;
    fixture_id: number;
    participant_id: number;
    inning: number;
    score: number;
    wickets: number;
    overs: number;
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

// --- Main Fixture and Response Types (V3) ---

export interface SportmonksV3Fixture {
    id: number;
    name: string;
    starting_at: string;
    league_id: number;
    state: SportmonksState;
    participants: SportmonksParticipant[];
    odds?: SportmonksOdd[];
    league?: SportmonksLeague;
    comments?: SportmonksComment[];
    venue?: SportmonksVenue;
    referee?: SportmonksReferee;
    officials?: { data: SportmonksReferee[] };
    // Sport specific data
    runs?: SportmonksV3Run[]; // Cricket
    scores?: FootballScore[]; // Football
    events?: FootballEvent[]; // Football
    periods?: FootballPeriod[]; // Football
    statistics?: any[];
    sidelined?: any;
    weatherReport?: any;
}

export interface SportmonksV3FixturesResponse {
    data: SportmonksV3Fixture[];
    pagination?: SportmonksPagination;
}

export interface SportmonksSingleV3FixtureResponse {
    data: SportmonksV3Fixture;
}

// Deprecated, but kept for reference if needed for other routes.
export interface SportmonksFootballLiveScore {
    id: number;
    name: string;
    starting_at: string;
    league: SportmonksLeague;
    state: SportmonksState;
    participants: SportmonksParticipant[];
    scores: FootballScore[];
    periods: FootballPeriod[] | null;
    events: FootballEvent[];
}

export interface SportmonksFootballLiveResponse {
    data: SportmonksFootballLiveScore[];
    pagination?: SportmonksPagination;
}


// --- PROCESSED TYPES FOR UI COMPONENTS ---

// This type is kept for potential future use but is largely superseded by ProcessedFixture
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

export interface ProcessedComment {
    id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

// The primary, unified, processed type for all matches (Football & Cricket)
export interface ProcessedFixture {
    id: number;
    sportKey: 'football' | 'cricket';
    name: string;
    startingAt: string;
    state: SportmonksState;
    isLive: boolean;
    isFinished: boolean;
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
        dnb?: {
            home?: number;
            away?: number;
        };
        dc?: {
            homeOrDraw?: number;
            awayOrDraw?: number;
            homeOrAway?: number;
        };
    };
    comments?: ProcessedComment[];
    venue?: { name: string; city: string; };
    referee?: { name: string; };
    // Live score data
    homeScore?: string | number;
    awayScore?: string | number;
    minute?: number;
    latestEvent?: string;
}
