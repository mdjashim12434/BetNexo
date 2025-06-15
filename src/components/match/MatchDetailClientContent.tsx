
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart2, Info, MessageSquare, TrendingUp, ArrowDownUp } from 'lucide-react';
import Image from 'next/image';
import type { Match } from '@/components/sports/MatchCard'; 
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Extended BetOutcome to include over/under
type BetOutcome = 'teamA' | 'draw' | 'teamB' | 'over' | 'under';
interface SelectedBetInfo {
  outcome: BetOutcome;
  point?: number; // For Over/Under bets
}

interface MatchDetailClientContentProps {
  initialMatch: Match;
}

export default function MatchDetailClientContent({ initialMatch }: MatchDetailClientContentProps) {
  const router = useRouter();
  const { user, balance, currency, updateBalance, loadingAuth } = useAuth();
  const { toast } = useToast();
  
  const [match, setMatch] = useState<Match>(initialMatch);
  // Store selected outcome details (including point for O/U)
  const [selectedBet, setSelectedBet] = useState<SelectedBetInfo | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    setMatch(initialMatch);
    // Reset selection when match changes
    setSelectedBet(null);
    setBetAmount('');
  }, [initialMatch]);

  useEffect(() => {
    if (selectedBet && match && betAmount) {
      const amount = parseFloat(betAmount);
      let odds = 0;
      switch (selectedBet.outcome) {
        case 'teamA': odds = match.homeWinOdds || 0; break;
        case 'draw': odds = match.drawOdds || 0; break;
        case 'teamB': odds = match.awayWinOdds || 0; break;
        case 'over': odds = match.totalsMarket?.overOdds || 0; break;
        case 'under': odds = match.totalsMarket?.underOdds || 0; break;
      }
      
      if (!isNaN(amount) && amount > 0 && odds > 0) {
        setPotentialWinnings(amount * odds);
      } else {
        setPotentialWinnings(0);
      }
    } else {
      setPotentialWinnings(0);
    }
  }, [selectedBet, betAmount, match]);

  const handleOutcomeSelect = (outcome: BetOutcome, point?: number) => {
    if (match?.status === 'finished') {
        toast({ title: "Match Finished", description: "Cannot place bets on finished matches.", variant: "destructive" });
        return;
    }
    const newSelection: SelectedBetInfo = { outcome, point };
    if (selectedBet && selectedBet.outcome === outcome && selectedBet.point === point) {
      setSelectedBet(null); // Deselect if same outcome clicked again
    } else {
      setSelectedBet(newSelection);
    }
  };

  const handlePlaceBet = async () => {
    if (!match || !selectedBet || !betAmount) {
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
      switch (selectedBet.outcome) {
        case 'teamA': outcomeText = match.homeTeam; break;
        case 'draw': outcomeText = 'Draw'; break;
        case 'teamB': outcomeText = match.awayTeam; break;
        case 'over': outcomeText = `Over ${selectedBet.point}`; break;
        case 'under': outcomeText = `Under ${selectedBet.point}`; break;
      }

      toast({
        title: "Bet Placed Successfully!",
        description: `You bet ${currency} ${amount.toFixed(2)} on ${outcomeText}. Potential winnings: ${currency} ${potentialWinnings.toFixed(2)}.`,
      });
      setSelectedBet(null);
      setBetAmount('');
      setPotentialWinnings(0);
    } catch (error) {
      console.error("Error placing bet:", error);
      toast({ title: "Bet Failed", description: "Could not place your bet. Please try again.", variant: "destructive" });
    }
  };

  if (loadingAuth) { 
    return <div className="text-center p-10">Loading user session...</div>;
  }
  
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const getOutcomeButton = (outcomeType: BetOutcome, label: string, oddsValue?: number, pointValue?: number) => {
    if (oddsValue === undefined || oddsValue === null) return null;
    const isSelected = selectedBet?.outcome === outcomeType && selectedBet?.point === pointValue;
    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        size="lg"
        className={cn("h-auto py-3 flex-1", { "ring-2 ring-primary ring-offset-2 ring-offset-background": isSelected })}
        onClick={() => handleOutcomeSelect(outcomeType, pointValue)}
        disabled={isFinished}
      >
        <div className="flex flex-col items-center">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-xl font-bold">{oddsValue.toFixed(2)}</span>
        </div>
      </Button>
    );
  };
  
  const selectedOutcomeText = () => {
    if (!selectedBet) return '';
    switch (selectedBet.outcome) {
        case 'teamA': return match.homeTeam;
        case 'draw': return 'Draw';
        case 'teamB': return match.awayTeam;
        case 'over': return `Over ${selectedBet.point}`;
        case 'under': return `Under ${selectedBet.point}`;
        default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="self-start">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
      </Button>

      <Card className="overflow-hidden shadow-xl">
        {match.imageUrl && (
          <div className="relative h-64 w-full">
            <Image src={match.imageUrl} alt={`${match.homeTeam} vs ${match.awayTeam}`} layout="fill" objectFit="cover" data-ai-hint={match.imageAiHint || `${match.sportTitle} action`} />
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
          <CardTitle className="font-headline text-3xl">{match.homeTeam} vs {match.awayTeam}</CardTitle>
          <CardDescription className="text-lg">{match.league || match.sportTitle} | {new Date(match.commenceTime).toLocaleString()}</CardDescription>
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
                  {/* H2H Odds */}
                  {(match.homeWinOdds || match.awayWinOdds || match.drawOdds) && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Match Winner (H2H):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                        {getOutcomeButton('teamA', match.homeTeam, match.homeWinOdds)}
                        {match.drawOdds && getOutcomeButton('draw', 'Draw', match.drawOdds)}
                        {getOutcomeButton('teamB', match.awayTeam, match.awayWinOdds)}
                        </div>
                    </div>
                  )}

                  {/* Totals (Over/Under) Odds */}
                  {match.totalsMarket && (match.totalsMarket.overOdds || match.totalsMarket.underOdds) && (
                    <div className="space-y-2 pt-4 border-t mt-4">
                        <p className="text-sm font-medium text-muted-foreground flex items-center">
                           <ArrowDownUp className="h-4 w-4 mr-1.5"/> Total Points/Goals: {match.totalsMarket.point}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                        {getOutcomeButton('over', `Over ${match.totalsMarket.point}`, match.totalsMarket.overOdds, match.totalsMarket.point)}
                        {getOutcomeButton('under', `Under ${match.totalsMarket.point}`, match.totalsMarket.underOdds, match.totalsMarket.point)}
                        </div>
                    </div>
                  )}
                  
                  {selectedBet && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold text-lg text-center">
                        Betting on: {selectedOutcomeText()}
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
                        disabled={!selectedBet || !betAmount || parseFloat(betAmount) <= 0 || isFinished || parseFloat(betAmount) > balance}
                      >
                        Place Bet
                      </Button>
                      {parseFloat(betAmount) > balance && (
                          <p className="text-xs text-destructive text-center">Insufficient balance.</p>
                      )}
                    </div>
                  )}
                  {!selectedBet && !isFinished && (
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
                      <p>Possession: {match.homeTeam} 55% - {match.awayTeam} 45% (Mock)</p>
                      <p>Score: {match.homeTeam} 1 - {match.awayTeam} 0 (If live/finished) (Mock)</p>
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
                      <p className="text-sm">Fan123: Go {match.homeTeam}!</p>
                      <p className="text-sm">ProBetPlayer: {match.awayTeam} looks strong today.</p>
                  </div>
                  <Input placeholder="Type your message..." className="mt-2" disabled />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
