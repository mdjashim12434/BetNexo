
'use client';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart2, Info, MessageSquare, Strikethrough, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { Match } from '@/components/sports/MatchCard'; 
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Moved mockMatches and getMatchDetails outside the component for generateStaticParams
const mockMatches: Match[] = [
    { id: '1', teamA: 'India', teamB: 'Australia', time: '14:00 Local', sport: 'Cricket', league: 'World Cup', oddsA: '1.80', oddsB: '2.10', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Cricket+Stadium', imageAiHint: 'cricket stadium' },
    { id: '2', teamA: 'England', teamB: 'South Africa', time: 'LIVE', sport: 'Cricket', league: 'Test Series', oddsA: '2.00', oddsDraw: '3.50', oddsB: '2.50', status: 'live', imageUrl: 'https://placehold.co/800x400.png?text=Live+Cricket+Action', imageAiHint: 'live cricket' },
    { id: '3', teamA: 'Real Madrid', teamB: 'Barcelona', time: 'Tomorrow 19:00 GMT', sport: 'Football', league: 'La Liga', oddsA: '2.20', oddsDraw: '3.20', oddsB: '3.00', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Football+Pitch', imageAiHint: 'football pitch' },
    { id: '4', teamA: 'Man City', teamB: 'Liverpool', time: 'LIVE', sport: 'Football', league: 'Premier League', oddsA: '1.90', oddsDraw: '3.60', oddsB: '3.80', status: 'live', imageUrl: 'https://placehold.co/800x400.png?text=Live+Football+Action', imageAiHint: 'live football' },
    { id: '5', teamA: 'Warriors', teamB: 'Lakers', time: 'Today 20:00 PST', sport: 'Basketball', league: 'NBA', oddsA: '1.75', oddsB: '2.15', status: 'upcoming', imageAiHint: 'basketball game' },
    { id: '6', teamA: 'Chennai Super Kings', teamB: 'Mumbai Indians', time: '20 Apr 2024, 18:30', sport: 'Cricket', league: 'IPL', oddsA: '1.95', oddsB: '1.85', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=IPL+Match', imageAiHint: 'cricket ipl' },
    { id: '7', teamA: 'PSG', teamB: 'Bayern Munich', time: 'LIVE', sport: 'Football', league: 'Champions League', oddsA: '2.50', oddsDraw: '3.40', oddsB: '2.70', status: 'live', imageAiHint: 'champions league' },
];

// This function will be used by generateStaticParams at build time
// and by the component at runtime (client-side)
const getMatchDetails = async (id: string): Promise<Match | null> => {
  // In a real app, fetch this from an API if data isn't static
  // For static export with dynamic params, this mock data is used.
  return mockMatches.find(m => m.id === id) || null;
};

// generateStaticParams function to pre-render paths at build time
export async function generateStaticParams() {
  // Generate params for a subset or all matches.
  // For a large number of matches, consider generating only popular ones or recent ones.
  return mockMatches.map((match) => ({
    id: match.id,
  }));
}

type BetOutcome = 'teamA' | 'draw' | 'teamB';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, balance, currency, updateBalance, loadingAuth } = useAuth();
  const { toast } = useToast();
  const matchId = typeof params.id === 'string' ? params.id : '';
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<BetOutcome | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (matchId) {
      setLoadingMatch(true);
      getMatchDetails(matchId).then(data => {
        setMatch(data);
        setLoadingMatch(false);
      }).catch(error => {
        console.error("Failed to load match details:", error);
        setMatch(null);
        setLoadingMatch(false);
      });
    } else {
      setLoadingMatch(false);
      setMatch(null); // No matchId, so no match
    }
  }, [matchId]);

  useEffect(() => {
    if (selectedOutcome && match && betAmount) {
      const amount = parseFloat(betAmount);
      let odds = 0;
      if (selectedOutcome === 'teamA' && match.oddsA) odds = parseFloat(match.oddsA);
      else if (selectedOutcome === 'draw' && match.oddsDraw) odds = parseFloat(match.oddsDraw);
      else if (selectedOutcome === 'teamB' && match.oddsB) odds = parseFloat(match.oddsB);
      
      if (!isNaN(amount) && amount > 0 && odds > 0) {
        setPotentialWinnings(amount * odds);
      } else {
        setPotentialWinnings(0);
      }
    } else {
      setPotentialWinnings(0);
    }
  }, [selectedOutcome, betAmount, match]);

  const handleOutcomeSelect = (outcome: BetOutcome) => {
    if (match?.status === 'finished') {
        toast({ title: "Match Finished", description: "Cannot place bets on finished matches.", variant: "destructive" });
        return;
    }
    setSelectedOutcome(outcome === selectedOutcome ? null : outcome); // Toggle selection
  };

  const handlePlaceBet = async () => {
    if (!match || !selectedOutcome || !betAmount) {
      toast({ title: "Missing Information", description: "Please select an outcome and enter a bet amount.", variant: "destructive" });
      return;
    }
    if (match.status === 'finished') {
        toast({ title: "Match Finished", description: "Cannot place bets on finished matches.", variant: "destructive" });
        return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive bet amount.", variant: "destructive" });
      return;
    }

    if (amount > balance) {
      toast({ title: "Insufficient Balance", description: `You need ${currency} ${amount.toFixed(2)} to place this bet. Your balance is ${currency} ${balance.toFixed(2)}.`, variant: "destructive" });
      return;
    }

    try {
      await updateBalance(-amount); 
      let outcomeText = '';
      if (selectedOutcome === 'teamA') outcomeText = match.teamA;
      else if (selectedOutcome === 'draw') outcomeText = 'Draw';
      else if (selectedOutcome === 'teamB') outcomeText = match.teamB;

      toast({
        title: "Bet Placed Successfully!",
        description: `You bet ${currency} ${amount.toFixed(2)} on ${outcomeText} to win. Potential winnings: ${currency} ${potentialWinnings.toFixed(2)}.`,
      });
      setSelectedOutcome(null);
      setBetAmount('');
      setPotentialWinnings(0);
    } catch (error) {
      console.error("Error placing bet:", error);
      toast({ title: "Bet Failed", description: "Could not place your bet. Please try again.", variant: "destructive" });
    }
  };

  if (loadingAuth || loadingMatch && !match ) { // Show loading if auth is loading OR match is loading AND not yet set
    return <AppLayout><div className="text-center p-10">Loading match details or redirecting...</div></AppLayout>;
  }
  
  // If user is not logged in (and auth is not loading anymore), they are redirected by the first useEffect.
  // If matchId is present but match is null after loading, it means match not found.
  if (matchId && !match && !loadingMatch) {
    return <AppLayout><div className="text-center p-10">Match not found.</div></AppLayout>;
  }
  
  // If there's no matchId (e.g. route was `/match/` without an id), or match could not be found
  if (!match) {
     return <AppLayout><div className="text-center p-10">Match details are unavailable. Please go back and select a match.</div></AppLayout>;
  }
  
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const getOutcomeButton = (outcome: BetOutcome, label: string, odds?: string) => {
    if (!odds) return null;
    const isSelected = selectedOutcome === outcome;
    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        size="lg"
        className={cn("h-auto py-3 flex-1", { "ring-2 ring-primary ring-offset-2 ring-offset-background": isSelected })}
        onClick={() => handleOutcomeSelect(outcome)}
        disabled={isFinished || !odds}
      >
        <div className="flex flex-col items-center">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-xl font-bold">{odds || 'N/A'}</span>
        </div>
      </Button>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="self-start">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
        </Button>

        <Card className="overflow-hidden shadow-xl">
          {match.imageUrl && (
            <div className="relative h-64 w-full">
              <Image src={match.imageUrl} alt={`${match.teamA} vs ${match.teamB}`} layout="fill" objectFit="cover" data-ai-hint={match.imageAiHint || `${match.sport} action`} />
               {(isLive || isFinished) && (
                <span className={cn("absolute top-4 right-4 text-white px-3 py-1.5 text-sm font-bold rounded", {
                  "bg-red-600 animate-pulse": isLive,
                  "bg-gray-600": isFinished,
                })}>
                  {isLive ? "LIVE" : "FINISHED"}
                </span>
              )}
            </div>
          )}
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{match.teamA} vs {match.teamB}</CardTitle>
            <CardDescription className="text-lg">{match.league} - {match.sport} | {match.time}</CardDescription>
             {!match.imageUrl && (isLive || isFinished) && (
                 <span className={cn("w-fit text-white px-3 py-1.5 text-sm font-bold rounded", {
                  "bg-red-600 animate-pulse": isLive,
                  "bg-gray-600": isFinished,
                 })}>
                    {isLive ? "LIVE" : "FINISHED"}
                 </span>
              )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="odds" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                <TabsTrigger value="odds">Odds & Bet</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
              <TabsContent value="odds">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Place Your Bet</CardTitle>
                    <CardDescription>Select an outcome and enter your stake.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                      {getOutcomeButton('teamA', match.teamA, match.oddsA)}
                      {match.oddsDraw && getOutcomeButton('draw', 'Draw', match.oddsDraw)}
                      {getOutcomeButton('teamB', match.teamB, match.oddsB)}
                    </div>
                    
                    {selectedOutcome && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h3 className="font-semibold text-lg text-center">
                          Betting on: {selectedOutcome === 'teamA' ? match.teamA : selectedOutcome === 'draw' ? 'Draw' : match.teamB}
                        </h3>
                        <div>
                          <label htmlFor="betAmount" className="block text-sm font-medium text-foreground mb-1">
                            Bet Amount ({currency})
                          </label>
                          <Input
                            id="betAmount"
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder={`Min 1 ${currency}`}
                            min="1"
                            step="any"
                            className="text-lg"
                            disabled={isFinished}
                          />
                        </div>
                        {potentialWinnings > 0 && (
                           <p className="text-sm text-center text-green-500 dark:text-green-400 flex items-center justify-center">
                             <TrendingUp className="h-4 w-4 mr-1" /> Potential Winnings: {currency} {potentialWinnings.toFixed(2)}
                           </p>
                        )}
                        <Button 
                          className="w-full font-semibold text-lg py-3 bg-accent text-accent-foreground hover:bg-accent/90" 
                          onClick={handlePlaceBet}
                          disabled={!selectedOutcome || !betAmount || parseFloat(betAmount) <= 0 || isFinished || parseFloat(betAmount) > balance}
                        >
                          Place Bet
                        </Button>
                        {parseFloat(betAmount) > balance && (
                            <p className="text-xs text-destructive text-center">Insufficient balance.</p>
                        )}
                      </div>
                    )}
                    {!selectedOutcome && !isFinished && (
                         <p className="text-sm text-muted-foreground text-center py-4">
                           Please select an outcome above to place a bet.
                         </p>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      Odds are subject to change. Please bet responsibly. Max stake applies.
                      {isFinished && <span className="block font-semibold text-destructive mt-1">This match has finished. Betting is closed.</span>}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stats">
                <Card>
                  <CardHeader><CardTitle className="font-headline flex items-center"><BarChart2 className="mr-2 h-5 w-5"/>Match Statistics</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Detailed match statistics will be available here. (e.g., possession, shots, score history)</p>
                    <div className="mt-4 space-y-2">
                        <p>Possession: {match.teamA} 55% - {match.teamB} 45% (Mock)</p>
                        <p>Score: {match.teamA} 1 - {match.teamB} 0 (If live/finished) (Mock)</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="info">
                <Card>
                  <CardHeader><CardTitle className="font-headline flex items-center"><Info className="mr-2 h-5 w-5"/>Match Information</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Information about venue, referees, and conditions.</p>
                     <div className="mt-4 space-y-2">
                        <p>Venue: Mock Stadium, City</p>
                        <p>Referee: John Smith (Mock)</p>
                        <p>Weather: Clear, 25°C (Mock)</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="chat">
                <Card>
                  <CardHeader><CardTitle className="font-headline flex items-center"><MessageSquare className="mr-2 h-5 w-5"/>Live Chat</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Live chat feature coming soon! Discuss the match with other fans.</p>
                     <div className="mt-4 h-40 border rounded p-2 overflow-y-auto bg-muted/20">
                        <p className="text-sm">Fan123: Go Team A!</p>
                        <p className="text-sm">ProBetPlayer: Team B looks strong today.</p>
                    </div>
                    <Input placeholder="Type your message..." className="mt-2" disabled />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

    