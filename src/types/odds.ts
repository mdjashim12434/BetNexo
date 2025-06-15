
// Raw types from The Odds API for client-side parsing
export interface OutcomeAPI {
  name: string; 
  price: number;
  point?: number; 
}

export interface MarketAPI {
  key: string; 
  last_update: string; 
  outcomes: OutcomeAPI[];
}

export interface BookmakerAPI {
  key: string;
  title: string;
  last_update: string; 
  markets: MarketAPI[];
}

export interface MatchDataAPI {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; 
  home_team: string;
  away_team: string;
  bookmakers: BookmakerAPI[];
}

// Simplified structure after client-side parsing
export interface TotalMarketOutcome {
  point: number;
  overOdds?: number;
  underOdds?: number;
}

export interface SimplifiedMatchOdds {
  id: string;
  sportKey: string; 
  sportTitle: string;
  commenceTime: string; 
  homeTeam: string;
  awayTeam: string;
  bookmakerTitle?: string;
  homeWinOdds?: number;
  awayWinOdds?: number;
  drawOdds?: number;
  totalsMarket?: TotalMarketOutcome;
}
