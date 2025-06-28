

// --- Common Types ---
export interface SportmonksState {
    id: number;
    state: string;
    name: string;
    short_name: string;
    developer_name: string;
}

export interface SportmonksPagination {
    count?: number;
    per_page?: number;
    current_page?: number;
    next_page?: string | null;
    has_more: boolean;
}

// --- V3 Football Specific Types ---
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

export interface SportmonksV3Participant {
    id: number;
    name: string;
    image_path: string;
    meta: { location: 'home' | 'away'; };
}

export interface SportmonksV3League {
    id: number;
    name: string;
    code?: string;
    country?: { id: number; name: string; };
}

export interface SportmonksV3Venue {
    id: number;
    name: string;
    city_name?: string;
    city?: string;
}

export interface SportmonksV3Referee {
    id: number;
    fullname: string;
}

export interface SportmonksV3Comment {
    id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

export interface FootballPeriod {
    id: number;
    ticking: boolean;
    minutes?: number;
}

export interface FootballScore {
    id: number;
    participant_id: number;
    score: { goals: number; };
    description: string;
}

export interface FootballEvent {
    id: number;
    type_id: number;
    type?: { id: number; name: string; code: string; };
    minute: number;
}

export interface SportmonksV3Fixture {
    id: number;
    name: string;
    starting_at: string;
    league_id: number;
    state?: SportmonksState;
    participants: SportmonksV3Participant[];
    odds?: SportmonksOdd[];
    league?: SportmonksV3League;
    comments?: SportmonksV3Comment[];
    venue?: SportmonksV3Venue;
    referee?: SportmonksV3Referee;
    scores?: FootballScore[];
    events?: FootballEvent[];
    periods?: FootballPeriod[];
}

export interface SportmonksV3FixturesResponse {
    data: SportmonksV3Fixture[];
    pagination?: SportmonksPagination;
}

export interface SportmonksSingleV3FixtureResponse {
    data: SportmonksV3Fixture;
}


// --- PROCESSED TYPES FOR UI COMPONENTS ---
export interface ProcessedComment {
    id: number;
    comment: string;
    minute: number;
    extra_minute: number | null;
    is_goal: boolean;
}

export interface ProcessedFixture {
    id: number | string; // Changed to support string IDs from other APIs
    sportKey: 'football';
    name: string;
    startingAt: string; // ISO String format
    state: Partial<SportmonksState>; // Made partial as not all APIs provide this full object
    isLive: boolean;
    isFinished: boolean;
    league: { id?: number; name: string; countryName: string; };
    homeTeam: { id?: number; name: string; image_path?: string; };
    awayTeam: { id?: number; name: string; image_path?: string; };
    odds: {
        home?: number;
        draw?: number;
        away?: number;
        overUnder?: { over?: number; under?: number; point?: number; };
        btts?: { yes?: number; no?: number; };
        dnb?: { home?: number; away?: number; };
        dc?: { homeOrDraw?: number; awayOrDraw?: number; homeOrAway?: number; };
    };
    homeScore?: string | number;
    awayScore?: string | number;
    
    // Optional fields that may not be available from all APIs
    comments?: ProcessedComment[];
    venue?: { name: string; city: string; };
    referee?: { name: string; };
    minute?: number;
    latestEvent?: { text: string; isGoal: boolean; };
}
