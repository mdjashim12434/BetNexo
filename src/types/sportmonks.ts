



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
    state: 'NS' | 'INPLAY' | 'HT' | 'FT' | 'ET' | 'PEN_LIVE' | 'AET' | 'BREAK' | 'POSTP' | 'CANCL' | 'ABAN' | 'SUSP' | 'AWARDED' | 'DELETED' | 'TBA' | 'WO' | 'AU' | 'Finished' | 'Live' | '1st Innings' | '2nd Innings' | 'Innings Break' | 'Cancelled'; // Common states, added more cricket states
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
    code?: string;
    country?: { id: number; name: string; };
}

export interface SportmonksVenue {
    id: number;
    name: string;
    city_name?: string; // V3 field
    city?: string; // V2 field
    country_name: string;
}

export interface SportmonksReferee {
    id: number;
    fullname: string;
    type?: { name: string; }; // For Cricket officials
}

export interface SportmonksOfficial {
    id: number;
    fullname: string;
    type: { name: string; };
}

export interface SportmonksPagination {
    count: number;
    per_page: number;
    current_page: number;
    next_page: string | null;
    has_more: boolean;
}

// --- Types for API V3 (Football & Cricket Details) ---

export interface SportmonksComment {
    id: number;
    fixture_id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

export interface SportmonksV3Run {
    id: number;
    fixture_id: number;
    participant_id: number;
    inning: number;
    score: number;
    wickets: number;
    overs: number;
}

export interface SportmonksV3Fixture {
    id: number;
    name: string;
    starting_at: string;
    league_id: number;
    state: SportmonksState;
    participants: SportmonksParticipant[];
    odds?: SportmonksOdd[];
    league?: CricketLeague;
    comments?: SportmonksComment[];
    venue?: SportmonksVenue;
    referee?: SportmonksReferee; // Football V3
    officials?: { data: SportmonksReferee[] }; // Cricket V3
    runs?: SportmonksV3Run[]; // Cricket V3 runs
    scores?: FootballScore[];
    events?: FootballEvent[];
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

// --- Types for Football Live Scores (V3) ---

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
    round?: any; // To support the new include parameter
}

export interface SportmonksFootballLiveResponse {
    data: SportmonksFootballLiveScore[];
    pagination?: SportmonksPagination;
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
    // New fields for live scores
    homeScore?: string | number;
    awayScore?: string | number;
    minute?: number;
    latestEvent?: string;
}


// --- V2 Specific Types for Cricket ---
export interface SportmonksV2Team {
    id: number;
    name: string;
    code: string;
    image_path: string;
}

export interface SportmonksV2League {
    id: number;
    name: string;
    code: string;
    country?: { id: number; name: string; }; // This might be from an include
}

export interface SportmonksV2Run {
    fixture_id: number;
    team_id: number;
    inning: number;
    score: number;
    wickets: number;
    overs: number;
}

export interface SportmonksV2OddData {
    id: number;
    name: string; // e.g., '2-Way'
    suspended: boolean;
    bookmaker: {
        data: {
            id: number;
            name: string;
            odds: {
                data: {
                    label: string; // e.g., '1', '2'
                    value: string;
                    winning: boolean | null;
                    handicap: string | null;
                }[];
            };
        }[];
    };
}


export interface SportmonksV2Fixture {
    id: number;
    league_id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
    status: string; // "NS", "Finished", etc.
    note: string;
    live: boolean;
    localteam: SportmonksV2Team;
    visitorteam: SportmonksV2Team;
    league: SportmonksV2League;
    runs: SportmonksV2Run[];
    venue?: SportmonksVenue;
    odds?: { data: SportmonksV2OddData[] };
    officials?: { data: SportmonksReferee[] };
    comments?: { data: SportmonksComment[] }; // v2 comments are nested
}

export interface SportmonksV2ApiResponse {
    data: SportmonksV2Fixture[];
    meta?: {
        pagination: {
            total: number;
            count: number;
            per_page: number;
            current_page: number;
            total_pages: number;
        }
    };
}

export interface SportmonksSingleV2FixtureResponse {
    data: SportmonksV2Fixture;
}
