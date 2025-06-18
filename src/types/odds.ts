
// Raw types from The Odds API for client-side parsing
export interface OutcomeAPI {
  name: string;
  price: number;
  point?: number;
}

export interface MarketAPI {
  key: string; // e.g., 'h2h', 'totals', 'btts', 'draw_no_bet', 'double_chance'
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

export interface BTTSMarketOutcome {
  yesOdds?: number;
  noOdds?: number;
}

export interface DrawNoBetMarketOutcome {
  homeOdds?: number; // Outcome name might be home_team
  awayOdds?: number; // Outcome name might be away_team
}

export interface DoubleChanceMarketOutcome {
  homeOrDrawOdds?: number; // 1X
  awayOrDrawOdds?: number; // X2
  homeOrAwayOdds?: number; // 12
}

export interface SimplifiedMatchOdds {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmakerTitle?: string;
  // H2H Market
  homeWinOdds?: number;
  awayWinOdds?: number;
  drawOdds?: number;
  // Totals Market
  totalsMarket?: TotalMarketOutcome;
  // BTTS Market
  bttsMarket?: BTTSMarketOutcome;
  // Draw No Bet Market
  drawNoBetMarket?: DrawNoBetMarketOutcome;
  // Double Chance Market
  doubleChanceMarket?: DoubleChanceMarketOutcome;
}
