
import HomeClientPage from './HomeClientPage';
import type { ProcessedFixture } from '@/types/sportmonks';

// Define types for The Odds API responses for clarity
type OddsApiMatch = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    markets: Array<{
      key: 'h2h';
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
};

type OddsApiScore = {
  id: string;
  completed: boolean;
  commence_time: string;
  home_team: string;
  away_team: string;
  scores: Array<{ name: string; score: string }> | null;
  last_update: string;
};

async function getHomePageMatches() {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9002';
  let upcomingMatchesRaw: OddsApiMatch[] = [];
  let liveScoresRaw: OddsApiScore[] = [];
  let error: string | null = null;

  try {
    const [oddsResult, scoresResult] = await Promise.allSettled([
      // Assuming this route correctly fetches from The Odds API for soccer odds
      fetch(`${API_BASE_URL}/api/football/odds`, { cache: 'no-store' }),
      fetch(`${API_BASE_URL}/api/the-odds-api/scores`, { cache: 'no-store' })
    ]);

    if (oddsResult.status === 'fulfilled' && oddsResult.value.ok) {
      upcomingMatchesRaw = await oddsResult.value.json();
    } else {
      const reason = oddsResult.status === 'rejected' ? oddsResult.reason : await oddsResult.value.text();
      console.error("Home page: Failed to fetch odds:", reason);
      error = "Could not fetch upcoming matches from The Odds API.";
    }

    if (scoresResult.status === 'fulfilled' && scoresResult.value.ok) {
      liveScoresRaw = await scoresResult.value.json();
    } else {
      const reason = scoresResult.status === 'rejected' ? scoresResult.reason : await scoresResult.value.text();
      console.error("Home page: Failed to fetch scores:", reason);
      const scoresError = "Could not fetch live scores from The Odds API.";
      error = error ? `${error}\n${scoresError}` : scoresError;
    }

    // Ensure we are working with arrays even if the API fails or returns non-arrays
    if (!Array.isArray(upcomingMatchesRaw)) upcomingMatchesRaw = [];
    if (!Array.isArray(liveScoresRaw)) liveScoresRaw = [];

    const scoresMap = new Map(liveScoresRaw.map(score => [score.id, score]));

    const allProcessedFixtures: ProcessedFixture[] = upcomingMatchesRaw.map((match): ProcessedFixture => {
      const scoreData = scoresMap.get(match.id);

      const isLive = !!scoreData && !scoreData.completed;
      const isFinished = !!scoreData && scoreData.completed;
      
      let homeScore: string | number = 0;
      let awayScore: string | number = 0;
      if (scoreData && scoreData.scores) {
        homeScore = scoreData.scores.find(s => s.name === match.home_team)?.score ?? 0;
        awayScore = scoreData.scores.find(s => s.name === match.away_team)?.score ?? 0;
      }

      const h2hMarket = match.bookmakers?.[0]?.markets.find(m => m.key === 'h2h');
      const odds = {
        home: h2hMarket?.outcomes.find(o => o.name === match.home_team)?.price,
        away: h2hMarket?.outcomes.find(o => o.name === match.away_team)?.price,
        draw: h2hMarket?.outcomes.find(o => o.name === 'Draw')?.price,
      };

      return {
        id: match.id,
        sportKey: 'football',
        name: `${match.home_team} vs ${match.away_team}`,
        startingAt: new Date(match.commence_time).toISOString(),
        state: { name: isLive ? 'Live' : (isFinished ? 'Finished' : 'Upcoming') },
        isLive,
        isFinished,
        league: { name: match.sport_title, countryName: 'N/A' },
        homeTeam: { name: match.home_team },
        awayTeam: { name: match.away_team },
        odds,
        homeScore,
        awayScore,
      };
    });

    // Add any live matches from scores that were not in the upcoming list
    liveScoresRaw.forEach(score => {
      if (!allProcessedFixtures.some(m => m.id === score.id)) {
         const homeScoreVal = score.scores?.find(s => s.name === score.home_team)?.score ?? 0;
         const awayScoreVal = score.scores?.find(s => s.name === score.away_team)?.score ?? 0;

         allProcessedFixtures.push({
            id: score.id,
            sportKey: 'football',
            name: `${score.home_team} vs ${score.away_team}`,
            startingAt: new Date(score.commence_time).toISOString(),
            state: { name: !score.completed ? 'Live' : 'Finished' },
            isLive: !score.completed,
            isFinished: score.completed,
            league: { name: 'Live Match', countryName: 'N/A' },
            homeTeam: { name: score.home_team },
            awayTeam: { name: score.away_team },
            odds: {}, // Odds are not available from the scores endpoint
            homeScore: homeScoreVal,
            awayScore: awayScoreVal,
         });
      }
    });

    const liveMatches = allProcessedFixtures.filter(f => f.isLive);
    const upcomingMatches = allProcessedFixtures.filter(f => !f.isLive && !f.isFinished);
    
    liveMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
    upcomingMatches.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

    return { 
      liveMatches: liveMatches.slice(0, 10), 
      upcomingMatches: upcomingMatches.slice(0, 10), 
      error: error 
    };

  } catch (e: any) {
    console.error("Home page: Generic failure fetching matches:", e);
    return { liveMatches: [], upcomingMatches: [], error: e.message || "An unexpected error occurred." };
  }
}


export default async function HomePage() {
  const { liveMatches, upcomingMatches, error } = await getHomePageMatches();

  return (
    <HomeClientPage
      initialLiveMatches={liveMatches}
      initialUpcomingMatches={upcomingMatches}
      initialError={error}
    />
  );
}
