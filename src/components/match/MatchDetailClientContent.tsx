
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart2, Info, TrendingUp, Goal, BookText, ShieldQuestion, MapPin, Gavel } from 'lucide-react';
import Image from 'next/image';
import type { ProcessedFixture } from '@/types/sportmonks';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db, addDoc, collection, serverTimestamp } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

// Extended BetOutcome to include new markets
type BetOutcome =
  | 'teamA' | 'draw' | 'teamB' // H2H
  | 'over' | 'under' // Totals
  | 'bttsYes' | 'bttsNo' // BTTS
  | 'dnbHome' | 'dnbAway' // DNB
  | 'dc1X' | 'dcX2' | 'dc12'; // DC

interface SelectedBetInfo {
  outcome: BetOutcome;
  point?: number; // For Over/Under bets
}

interface MatchDetailClientContentProps {
  initialMatch: ProcessedFixture;
}

export default function MatchDetailClientContent({ initialMatch }: MatchDetailClientContentProps) {
  const router = useRouter();
  const { user, balance, currency, updateBalance, loadingAuth } = useAuth();
  const { toast } = useToast();

  const [match, setMatch] = useState<ProcessedFixture>(initialMatch);
  const [selectedBet, setSelectedBet] = useState<SelectedBetInfo | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    setMatch(initialMatch);
    setSelectedBet(null);
    setBetAmount('');
  }, [initialMatch]);

  useEffect(() => {
    if (selectedBet && match && betAmount) {
      const amount = parseFloat(betAmount);
      let odds = 0;
      switch (selectedBet.outcome) {
        case 'teamA': odds = match.odds.home || 0; break;
        case 'draw': odds = match.odds.draw || 0; break;
        case 'teamB': odds = match.odds.away || 0; break;
        case 'over': odds = match.odds.overUnder?.over || 0; break;
        case 'under': odds = match.odds.overUnder?.under || 0; break;
        case 'bttsYes': odds = match.odds.btts?.yes || 0; break;
        case 'bttsNo': odds = match.odds.btts?.no || 0; break;
        case 'dnbHome': odds = match.odds.dnb?.home || 0; break;
        case 'dnbAway': odds = match.odds.dnb?.away || 0; break;
        case 'dc1X': odds = match.odds.dc?.homeOrDraw || 0; break;
        case 'dcX2': odds = match.odds.dc?.awayOrDraw || 0; break;
        case 'dc12': odds = match.odds.dc?.homeOrAway || 0; break;
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
    const newSelection: SelectedBetInfo = { outcome, point };
    if (selectedBet && selectedBet.outcome === outcome && selectedBet.point === point) {
      setSelectedBet(null);
    } else {
      setSelectedBet(newSelection);
    }
  };

  const handlePlaceBet = async () => {
    if (!user || !user.customUserId || !match || !selectedBet || !betAmount) {
      toast({ title: "Missing Information", description: "User, outcome, or bet amount is missing.", variant: "destructive" });
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

    setIsPlacingBet(true);
    let oddsAtBetTime = 0;
    let outcomeText = selectedOutcomeTextDisplay();

    switch (selectedBet.outcome) {
      case 'teamA': oddsAtBetTime = match.odds.home || 0; break;
      case 'draw': oddsAtBetTime = match.odds.draw || 0; break;
      case 'teamB': oddsAtBetTime = match.odds.away || 0; break;
      case 'over': oddsAtBetTime = match.odds.overUnder?.over || 0; break;
      case 'under': oddsAtBetTime = match.odds.overUnder?.under || 0; break;
      case 'bttsYes': oddsAtBetTime = match.odds.btts?.yes || 0; break;
      case 'bttsNo': oddsAtBetTime = match.odds.btts?.no || 0; break;
      case 'dnbHome': oddsAtBetTime = match.odds.dnb?.home || 0; break;
      case 'dnbAway': oddsAtBetTime = match.odds.dnb?.away || 0; break;
      case 'dc1X': oddsAtBetTime = match.odds.dc?.homeOrDraw || 0; break;
      case 'dcX2': oddsAtBetTime = match.odds.dc?.awayOrDraw || 0; break;
      case 'dc12': oddsAtBetTime = match.odds.dc?.homeOrAway || 0; break;
    }

    if (oddsAtBetTime <= 0) {
      toast({ title: "Odds Error", description: "Could not retrieve valid odds for this selection.", variant: "destructive" });
      setIsPlacingBet(false);
      return;
    }

    try {
      await updateBalance(-amount);
      const betData = {
        userId: user.customUserId,
        userName: user.name || user.email || 'Unknown User',
        matchId: String(match.id),
        matchHomeTeam: match.homeTeam.name,
        matchAwayTeam: match.awayTeam.name,
        matchSportTitle: match.league.name,
        betOutcome: selectedBet.outcome,
        betPoint: (selectedBet.outcome === 'over' || selectedBet.outcome === 'under') ? (match.odds.overUnder?.point || null) : null,
        betAmount: amount,
        oddsAtBetTime: oddsAtBetTime,
        potentialWinnings: potentialWinnings,
        status: 'pending' as const,
        betTimestamp: serverTimestamp(),
        resolvedTimestamp: null,
      };
      await addDoc(collection(db, "bets"), betData);

      toast({
        title: "Bet Placed Successfully!",
        description: `You bet ${currency} ${amount.toFixed(2)} on ${outcomeText}. Potential winnings: ${currency} ${potentialWinnings.toFixed(2)}.`,
      });
      setSelectedBet(null);
      setBetAmount('');
    } catch (error: any) {
      console.error("Error placing bet:", error);
      await updateBalance(amount);
      toast({ title: "Bet Failed", description: `Could not place your bet. ${error.message || "Please try again."}`, variant: "destructive" });
    } finally {
      setIsPlacingBet(false);
    }
  };

  if (loadingAuth) {
    return <div className="text-center p-10">Loading user session...</div>;
  }
  
  const isFinished = match.isFinished;

  const getOutcomeButton = (outcomeType: BetOutcome, label: string, oddsValue?: number, pointValue?: number, icon?: React.ElementType) => {
    if (oddsValue === undefined || oddsValue === null || oddsValue <=0) return null;
    const isSelected = selectedBet?.outcome === outcomeType && selectedBet?.point === pointValue;
    const IconComponent = icon;
    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        size="lg"
        className={cn("h-auto py-3 flex-1", { "ring-2 ring-primary ring-offset-2 ring-offset-background": isSelected })}
        onClick={() => handleOutcomeSelect(outcomeType, pointValue)}
        disabled={isFinished || isPlacingBet}
      >
        <div className="flex flex-col items-center">
          <span className="text-sm text-muted-foreground flex items-center">
            {IconComponent && <IconComponent className="h-4 w-4 mr-1.5" />}
            {label}
          </span>
          <span className="text-xl font-bold">{oddsValue.toFixed(2)}</span>
        </div>
      </Button>
    );
  };

  const selectedOutcomeTextDisplay = (): string => {
    if (!selectedBet || !match) return '';
    switch (selectedBet.outcome) {
      case 'teamA': return match.homeTeam.name;
      case 'draw': return 'Draw';
      case 'teamB': return match.awayTeam.name;
      case 'over': return `Over ${match.odds.overUnder?.point}`;
      case 'under': return `Under ${match.odds.overUnder?.point}`;
      case 'bttsYes': return 'Both Teams to Score: Yes';
      case 'bttsNo': return 'Both Teams to Score: No';
      case 'dnbHome': return `DNB: ${match.homeTeam.name}`;
      case 'dnbAway': return `DNB: ${match.awayTeam.name}`;
      case 'dc1X': return `DC: ${match.homeTeam.name} or Draw`;
      case 'dcX2': return `DC: ${match.awayTeam.name} or Draw`;
      case 'dc12': return `DC: ${match.homeTeam.name} or ${match.awayTeam.name}`;
      default: return 'N/A';
    }
  };
  
  const isLive = match.isLive;
  const hasAnyFootballOdds = (match.odds.home || (match.odds.overUnder && match.odds.overUnder.over) || (match.odds.btts && match.odds.btts.yes) || (match.odds.dnb && match.odds.dnb.home) || (match.odds.dc && match.odds.dc.homeOrDraw));

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="self-start" disabled={isPlacingBet}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
      </Button>

      <Card className="overflow-hidden shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{match.name}</CardTitle>
          <CardDescription className="text-lg">{match.league.name} | {format(new Date(match.startingAt), "PPp")}</CardDescription>
            {(isLive || isFinished) && (
              <span className={cn("w-fit text-white px-3 py-1.5 text-sm font-bold rounded", { "bg-red-600 animate-pulse": isLive, "bg-gray-600": isFinished })}>
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
              <TabsTrigger value="commentary">Commentary</TabsTrigger>
            </TabsList>
            <TabsContent value="odds">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Place Your Bet</CardTitle>
                  <CardDescription>Select an outcome and enter your stake.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* H2H Odds */}
                  {(match.odds.home || match.odds.away) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Match Winner:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                        {getOutcomeButton('teamA', match.homeTeam.name, match.odds.home)}
                        {getOutcomeButton('draw', 'Draw', match.odds.draw)}
                        {getOutcomeButton('teamB', match.awayTeam.name, match.odds.away)}
                      </div>
                    </div>
                  )}

                  {/* Over/Under Odds */}
                  {match.odds.overUnder?.point && (
                     <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Goals Over/Under ({match.odds.overUnder.point}):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                            {getOutcomeButton('over', `Over ${match.odds.overUnder.point}`, match.odds.overUnder?.over, match.odds.overUnder.point)}
                            {getOutcomeButton('under', `Under ${match.odds.overUnder.point}`, match.odds.overUnder?.under, match.odds.overUnder.point)}
                        </div>
                    </div>
                  )}

                   {/* BTTS Odds */}
                  {match.odds.btts && (
                     <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Both Teams to Score?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                            {getOutcomeButton('bttsYes', 'Yes', match.odds.btts?.yes)}
                            {getOutcomeButton('bttsNo', 'No', match.odds.btts?.no)}
                        </div>
                    </div>
                  )}
                  
                  {/* DNB Odds */}
                  {match.odds.dnb && (
                     <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Draw No Bet:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                            {getOutcomeButton('dnbHome', match.homeTeam.name, match.odds.dnb?.home)}
                            {getOutcomeButton('dnbAway', match.awayTeam.name, match.odds.dnb?.away)}
                        </div>
                    </div>
                  )}

                   {/* DC Odds */}
                  {match.odds.dc && (
                     <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Double Chance:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                            {getOutcomeButton('dc1X', `${match.homeTeam.name} or Draw`, match.odds.dc?.homeOrDraw)}
                            {getOutcomeButton('dcX2', `${match.awayTeam.name} or Draw`, match.odds.dc?.awayOrDraw)}
                             {getOutcomeButton('dc12', `${match.homeTeam.name} or ${match.awayTeam.name}`, match.odds.dc?.homeOrAway)}
                        </div>
                    </div>
                  )}


                   {/* No Odds Available */}
                   {!hasAnyFootballOdds && !isFinished && (
                        <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center">
                            <ShieldQuestion className="h-10 w-10 mb-3 text-primary/50" />
                            <p className="font-semibold">Odds not available for this match yet.</p>
                            <p className="text-sm">Please check back closer to the start time.</p>
                        </div>
                   )}

                  {selectedBet && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold text-lg text-center">
                        Betting on: {selectedOutcomeTextDisplay()}
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
                          disabled={isFinished || isPlacingBet}
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
                        disabled={isPlacingBet || !selectedBet || !betAmount || parseFloat(betAmount) <= 0 || isFinished || parseFloat(betAmount) > balance}
                      >
                        {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                      </Button>
                      {parseFloat(betAmount) > balance && (
                        <p className="text-xs text-destructive text-center">Insufficient balance.</p>
                      )}
                    </div>
                  )}
                  {!selectedBet && !isFinished && hasAnyFootballOdds && (
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
                <CardHeader><CardTitle className="font-headline flex items-center"><BarChart2 className="mr-2 h-5 w-5" />Match Statistics</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Detailed match statistics for football will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="info">
              <Card>
                <CardHeader><CardTitle className="font-headline flex items-center"><Info className="mr-2 h-5 w-5" />Match Information</CardTitle></CardHeader>
                <CardContent>
                   <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-muted-foreground">League</h4>
                        <p>{match.league.name}{match.league.countryName !== 'N/A' && ` - ${match.league.countryName}`}</p>
                      </div>
                      {match.venue && (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground"/>
                          <div>
                            <h4 className="font-semibold text-muted-foreground">Venue</h4>
                            <p>{match.venue.name}, {match.venue.city}</p>
                          </div>
                        </div>
                      )}
                      {match.referee && (
                        <div className="flex items-start">
                           <Gavel className="h-4 w-4 mr-2 mt-1 text-muted-foreground"/>
                           <div>
                            <h4 className="font-semibold text-muted-foreground">Referee</h4>
                            <p>{match.referee.name}</p>
                           </div>
                        </div>
                      )}
                      {!match.venue && !match.referee && (
                        <p className="text-muted-foreground">Detailed match information is not available.</p>
                      )}
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="commentary">
              <Card>
                <CardHeader><CardTitle className="font-headline flex items-center"><BookText className="mr-2 h-5 w-5"/>Live Commentary</CardTitle></CardHeader>
                <CardContent>
                  {match.comments && match.comments.length > 0 ? (
                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                      <div className="space-y-4">
                        {match.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                {comment.minute}'
                              </span>
                            </div>
                            <div className="pt-1">
                              <p className={cn("text-sm", { "font-bold text-primary": comment.is_goal })}>
                                {comment.is_goal && <Goal className="inline-block h-4 w-4 mr-1.5 text-green-500" />}
                                {comment.comment}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-center py-10">No live commentary available for this match.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
