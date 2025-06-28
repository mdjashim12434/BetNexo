
'use client';

import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Ticket, RefreshCw, Info, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { db, collection, query, where, orderBy, getDocs, Timestamp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled';
// Extended BetOutcome to match MatchDetailClientContent
type BetOutcomeFirestore =
  | 'teamA' | 'draw' | 'teamB' // H2H
  | 'over' | 'under' // Totals
  | 'bttsYes' | 'bttsNo' // BTTS
  | 'dnbHome' | 'dnbAway' // Draw No Bet
  | 'dc1X' | 'dcX2' | 'dc12'; // Double Chance

interface BetDocument {
  id: string;
  userId: number; // Changed from string to number to store customUserId
  userName: string;
  matchId: string;
  matchHomeTeam: string;
  matchAwayTeam: string;
  matchSportTitle: string;
  betOutcome: BetOutcomeFirestore; // Use the extended type
  betPoint: number | null;
  betAmount: number;
  oddsAtBetTime: number;
  potentialWinnings: number;
  status: BetStatus;
  betTimestamp: Timestamp;
  resolvedTimestamp: Timestamp | null;
}

export default function BetHistoryPage() {
  const { user, currency, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [bets, setBets] = useState<BetDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBetHistory = useCallback(async () => {
    if (!user || !user.customUserId) return;
    setIsLoading(true);
    try {
      const betsQuery = query(
        collection(db, "bets"),
        where("userId", "==", user.customUserId),
        orderBy("betTimestamp", "desc")
      );
      const querySnapshot = await getDocs(betsQuery);
      const fetchedBets: BetDocument[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBets.push({ id: doc.id, ...doc.data() } as BetDocument);
      });
      setBets(fetchedBets);
    } catch (error: any) {
      console.error("Error fetching bet history:", error);
      let description = "Could not fetch your bet history.";
      
      const isIndexError = (error.code && error.code.toLowerCase().includes("failed-precondition")) || 
                           (error.message && error.message.toLowerCase().includes("index"));

      if (isIndexError) {
        description = `A Firestore index is needed to see your bet history. Please check your browser's developer console for a link to create it, or manually create an index on the 'bets' collection (userId ASC, betTimestamp DESC).`;
      } else if (error.message) {
        description += ` Details: ${error.message}`;
      }
      
      toast({ title: "Error", description, variant: "destructive", duration: 15000 });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    } else if (user) {
      fetchBetHistory();
    }
  }, [user, loadingAuth, router, fetchBetHistory]);

  const getBetOutcomeText = (bet: BetDocument) => {
    switch (bet.betOutcome) {
      case 'teamA': return bet.matchHomeTeam;
      case 'teamB': return bet.matchAwayTeam;
      case 'draw': return 'Draw';
      case 'over': return `Over ${bet.betPoint}`;
      case 'under': return `Under ${bet.betPoint}`;
      case 'bttsYes': return 'BTTS: Yes';
      case 'bttsNo': return 'BTTS: No';
      case 'dnbHome': return `DNB: ${bet.matchHomeTeam}`;
      case 'dnbAway': return `DNB: ${bet.matchAwayTeam}`;
      case 'dc1X': return `DC: ${bet.matchHomeTeam} or Draw`;
      case 'dcX2': return `DC: ${bet.matchAwayTeam} or Draw`;
      case 'dc12': return `DC: ${bet.matchHomeTeam} or ${bet.matchAwayTeam}`;
      default:
        // Attempt to provide a fallback for unknown betOutcome from older data
        const exhaustiveCheck: never = bet.betOutcome;
        console.warn("Unknown bet.betOutcome in getBetOutcomeText:", exhaustiveCheck);
        return `Unknown (${String(bet.betOutcome)})`;
    }
  };

  const getStatusBadgeVariant = (status: BetStatus) => {
    switch (status) {
      case 'won': return 'default';
      case 'lost': return 'destructive';
      case 'pending': return 'outline';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: BetStatus) => {
    switch (status) {
      case 'won': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'lost': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      case 'cancelled': return <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return null;
    }
  };

  const formatDate = (timestamp?: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    try {
      return format(timestamp.toDate(), "PPp");
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (loadingAuth || isLoading && !user) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading session and bet history...</div></div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login...</div></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="space-y-8">
          <Card className="shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-headline text-2xl flex items-center">
                  <Ticket className="mr-2 h-6 w-6 text-primary" /> Your Bet History
                </CardTitle>
                <CardDescription>Review your past and pending bets.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={fetchBetHistory} disabled={isLoading} aria-label="Refresh bet history">
                <RefreshCw className={cn("h-4 w-4", { "animate-spin": isLoading })} />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading && bets.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Loading your bets...</div>
              ) : !isLoading && bets.length === 0 ? (
                <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8">
                  <Info className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">You haven't placed any bets yet.</p>
                  <p className="text-muted-foreground text-center text-sm">Explore matches and place some bets!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Match</TableHead>
                        <TableHead>Bet On</TableHead>
                        <TableHead>Stake</TableHead>
                        <TableHead>Odds</TableHead>
                        <TableHead>Return</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Placed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bets.map((bet) => (
                        <TableRow key={bet.id}>
                          <TableCell>
                            <div>{bet.matchHomeTeam} vs {bet.matchAwayTeam}</div>
                            <div className="text-xs text-muted-foreground">{bet.matchSportTitle}</div>
                          </TableCell>
                          <TableCell>{getBetOutcomeText(bet)}</TableCell>
                          <TableCell>{currency} {bet.betAmount.toFixed(2)}</TableCell>
                          <TableCell>{bet.oddsAtBetTime.toFixed(2)}</TableCell>
                          <TableCell>
                            {bet.status === 'won' ? (
                              <span className="text-green-500 flex items-center">
                                <TrendingUp className="mr-1 h-4 w-4" />{currency} {bet.potentialWinnings.toFixed(2)}
                              </span>
                            ) : bet.status === 'lost' || bet.status === 'cancelled' ? (
                              <span className="text-red-500 flex items-center">
                                <TrendingDown className="mr-1 h-4 w-4" />{currency} 0.00
                              </span>
                            ) : (
                              `${currency} ${bet.potentialWinnings.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(bet.status)}
                              className={cn("capitalize text-xs flex items-center gap-1", {
                                'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': bet.status === 'won',
                                'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-700/50': bet.status === 'pending',
                              })}
                            >
                              {getStatusIcon(bet.status)}
                              {bet.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(bet.betTimestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
