
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, Zap, MoreVertical, Pin, TrendingUp, Goal, BookText, ShieldQuestion, MapPin, Gavel, Info } from 'lucide-react';
import type { ProcessedFixture } from '@/types/sportmonks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { db, addDoc, collection, serverTimestamp } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';


type BetOutcome =
  | 'teamA' | 'draw' | 'teamB' // H2H
  | 'over' | 'under' // Totals
  | 'bttsYes' | 'bttsNo' // BTTS
  | 'dnbHome' | 'dnbAway' // DNB
  | 'dc1X' | 'dcX2' | 'dc12'; // DC

interface SelectedBetInfo {
  outcome: BetOutcome;
  point?: number;
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


  if (loadingAuth || !user) {
    return <div className="text-center p-10">Loading...</div>;
  }
  
  const isFinished = match.isFinished;
  const isLive = match.isLive;

  const getOutcomeButton = (outcomeType: BetOutcome, label: string, oddsValue?: number, pointValue?: number, className?: string) => {
    if (oddsValue === undefined || oddsValue === null || oddsValue <= 0) {
      return <div className={cn("flex-1 h-16 bg-muted/30 rounded-md", className)} />;
    }
    const isSelected = selectedBet?.outcome === outcomeType && selectedBet?.point === pointValue;
    return (
      <Button
        variant={isSelected ? "default" : "secondary"}
        size="lg"
        className={cn("h-auto py-2 flex-1 flex flex-col items-center justify-center leading-tight", { "ring-2 ring-primary ring-offset-2 ring-offset-background": isSelected }, className)}
        onClick={() => handleOutcomeSelect(outcomeType, pointValue)}
        disabled={isFinished || isPlacingBet}
      >
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-bold">{oddsValue.toFixed(3)}</span>
      </Button>
    );
  };

  const renderOddsMarket = (market: { title: string; odds: (React.ReactNode | null)[] }) => {
    if (market.odds.every(o => o === null)) return null;
    return (
      <AccordionItem value={market.title.replace(/\s/g, '-')}>
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{market.title}</h3>
            <span className="text-muted-foreground text-xs">({market.odds.filter(Boolean).length})</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {market.odds}
          </div>
        </AccordionContent>
      </AccordionItem>
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

  const hasAnyFootballOdds = (match.odds.home || (match.odds.overUnder && match.odds.overUnder.over) || (match.odds.btts && match.odds.btts.yes) || (match.odds.dnb && match.odds.dnb.home) || (match.odds.dc && match.odds.dc.homeOrDraw));

  return (
    <div className="bg-background">
      {/* Header section */}
      <div className="bg-primary/90 text-primary-foreground p-2 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary">
          <ArrowLeft />
        </Button>
        <div className="text-center">
          <h1 className="font-semibold text-sm leading-tight truncate max-w-[200px]">{match.league.name}</h1>
          <p className="text-xs opacity-80">{match.league.countryName}</p>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="hover:bg-primary"><Zap /></Button>
          <Button variant="ghost" size="icon" className="hover:bg-primary"><MoreVertical /></Button>
        </div>
      </div>

      {/* Match Info Card */}
      <div className="relative h-48 flex flex-col justify-between p-4 text-white">
        <Image src="https://placehold.co/800x300.png" alt="Stadium background" layout="fill" objectFit="cover" className="absolute inset-0 z-0 opacity-10" data-ai-hint="stadium crowd" />
         <div className="absolute inset-0 bg-gradient-to-b from-card to-background z-[-1]"></div>
        <p className="text-center text-xs font-semibold">Round {match.state.round_id || '17'}</p>

        <div className="flex justify-around items-center">
          <div className="flex-1 flex flex-col items-center text-center gap-2">
            <Image src={match.homeTeam.image_path || 'https://placehold.co/80x80.png'} width={56} height={56} alt={match.homeTeam.name} data-ai-hint="team logo" />
            <span className="font-bold text-sm">{match.homeTeam.name}</span>
          </div>
          <div className="text-center">
            <p className="text-5xl font-black">{match.homeScore} : {match.awayScore}</p>
          </div>
          <div className="flex-1 flex flex-col items-center text-center gap-2">
            <Image src={match.awayTeam.image_path || 'https://placehold.co/80x80.png'} width={56} height={56} alt={match.awayTeam.name} data-ai-hint="team logo" />
            <span className="font-bold text-sm">{match.awayTeam.name}</span>
          </div>
        </div>
        
        <p className="text-center text-xs font-semibold">
          {isLive 
            ? `${match.state?.name || 'Live'}${match.minute ? `, ${String(match.minute).padStart(2, '0')}'` : ''}` 
            : `Starts at ${format(new Date(match.startingAt), 'HH:mm')}`}
        </p>
      </div>
      
      {/* Tabs and Odds */}
      <div className="bg-card rounded-t-2xl -mt-4 z-10 relative p-2">
         <Tabs defaultValue="odds" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 mb-2">
                <TabsTrigger value="odds">Information</TabsTrigger>
                <TabsTrigger value="stream" disabled>Stream</TabsTrigger>
            </TabsList>
            <TabsContent value="odds" className="pt-2">
                <div className="space-y-2">
                    <Accordion type="multiple" defaultValue={['1X2', 'Double-Chance', 'Both-Teams-To-Score']} className="w-full">
                        {renderOddsMarket({ title: '1X2', odds: [ getOutcomeButton('teamA', 'W1', match.odds.home), getOutcomeButton('draw', 'X', match.odds.draw), getOutcomeButton('teamB', 'W2', match.odds.away) ]})}
                        {renderOddsMarket({ title: 'Double Chance', odds: [ getOutcomeButton('dc1X', '1X', match.odds.dc?.homeOrDraw), getOutcomeButton('dc12', '12', match.odds.dc?.homeOrAway), getOutcomeButton('dcX2', '2X', match.odds.dc?.awayOrDraw) ]})}
                        {renderOddsMarket({ title: 'Both Teams To Score', odds: [ getOutcomeButton('bttsYes', 'Yes', match.odds.btts?.yes, undefined, 'col-span-1'), getOutcomeButton('bttsNo', 'No', match.odds.btts?.no, undefined, 'col-span-1') ]})}
                        {match.odds.overUnder && renderOddsMarket({ title: `Total Over/Under (${match.odds.overUnder.point})`, odds: [ getOutcomeButton('over', 'Over', match.odds.overUnder.over, match.odds.overUnder.point, 'col-span-1'), getOutcomeButton('under', 'Under', match.odds.overUnder.under, match.odds.overUnder.point, 'col-span-1') ]})}
                    </Accordion>
                </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* Bet Slip Area */}
      {selectedBet && (
        <div className="sticky bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background border-t-2 border-primary shadow-2xl z-20">
             <h3 className="font-semibold text-lg text-center mb-2">
                Your Bet: <span className="text-primary">{selectedOutcomeTextDisplay()}</span>
            </h3>
            <div className="flex gap-2 items-end">
                <div className="flex-grow">
                    <label htmlFor="betAmount" className="block text-xs font-medium text-muted-foreground mb-1">
                        Amount ({currency})
                    </label>
                    <Input id="betAmount" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="0.00" min="1" step="any" className="text-lg" disabled={isPlacingBet} />
                </div>
                <Button className="h-12 text-lg" onClick={handlePlaceBet} disabled={isPlacingBet || !betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance}>
                    Place Bet
                </Button>
            </div>
            {potentialWinnings > 0 && (
                <p className="text-xs text-center text-green-500 mt-2 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> Potential Winnings: {currency} {potentialWinnings.toFixed(2)}
                </p>
            )}
            {betAmount && parseFloat(betAmount) > balance && (
                <p className="text-xs text-destructive text-center mt-1">Insufficient balance.</p>
            )}
        </div>
      )}
    </div>
  );
}
