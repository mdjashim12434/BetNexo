
// Raw types from The Odds API for internal parsing in API route
export interface OutcomeAPI {
  name: string; // For H2H: team name or "Draw". For Totals: "Over" or "Under"
  price: number;
  point?: number; // Only for Totals (Over/Under) and Spreads markets
}

export interface MarketAPI {
  key: string; // 'h2h', 'spreads', 'totals'
  last_update: string; // ISO date string
  outcomes: OutcomeAPI[];
}

export interface BookmakerAPI {
  key: string;
  title: string;
  last_update: string; // ISO date string
  markets: MarketAPI[];
}

export interface MatchDataAPI {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO date string
  home_team: string;
  away_team: string;
  bookmakers: BookmakerAPI[];
}

// Simplified structure for frontend consumption
export interface TotalMarketOutcome {
  point: number;
  overOdds?: number;
  underOdds?: number;
}

export interface SimplifiedMatchOdds {
  id: string;
  sportKey: string; // Added sportKey for easier linking and fetching
  sportTitle: string;
  commenceTime: string; 
  homeTeam: string;
  awayTeam: string;
  bookmakerTitle?: string;
  // H2H Odds
  homeWinOdds?: number;
  awayWinOdds?: number;
  drawOdds?: number;
  // Totals (Over/Under) Market - focusing on one primary market for simplicity
  totalsMarket?: TotalMarketOutcome;
}
