
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ListChecks, User, ShieldCheck, XCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled';

interface Bet {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  matchName: string; // e.g., "Team A vs Team B"
  sport: string;
  betOn: string; // e.g., "Team A", "Draw", "Team B"
  stake: number;
  odds: number;
  potentialWinnings: number;
  status: BetStatus;
  betTime: string;
  resolvedTime?: string;
}

const mockBets: Bet[] = [
  { id: 'bet001', userId: 'user001', userName: 'Alice W.', matchId: 'match001', matchName: 'India vs Australia', sport: 'Cricket', betOn: 'India', stake: 10, odds: 1.8, potentialWinnings: 18, status: 'won', betTime: '2024-06-10 14:00', resolvedTime: '2024-06-10 18:00' },
  { id: 'bet002', userId: 'user002', userName: 'Bob B.', matchId: 'match002', matchName: 'Real Madrid vs Barcelona', sport: 'Football', betOn: 'Draw', stake: 20, odds: 3.5, potentialWinnings: 70, status: 'lost', betTime: '2024-06-11 10:00', resolvedTime: '2024-06-11 12:00' },
  { id: 'bet003', userId: 'user001', userName: 'Alice W.', matchId: 'match003', matchName: 'Lakers vs Warriors', sport: 'Basketball', betOn: 'Lakers', stake: 50, odds: 2.1, potentialWinnings: 105, status: 'pending', betTime: '2024-06-12 09:00' },
  { id: 'bet004', userId: 'user003', userName: 'Charlie B.', matchId: 'match001', matchName: 'India vs Australia', sport: 'Cricket', betOn: 'Australia', stake: 5, odds: 2.0, potentialWinnings: 10, status: 'lost', betTime: '2024-06-10 13:30', resolvedTime: '2024-06-10 18:00' },
  { id: 'bet005', userId: 'user004', userName: 'Diana P.', matchId: 'match004', matchName: 'CSK vs MI', sport: 'Cricket', betOn: 'CSK', stake: 100, odds: 1.95, potentialWinnings: 195, status: 'cancelled', betTime: '2024-06-09 18:00', resolvedTime: '2024-06-09 18:05' },
];

export default function BetHistoryTab() {
  const [bets, setBets] = useState<Bet[]>(mockBets);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBets = bets.filter(bet =>
    bet.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bet.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bet.matchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bet.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: BetStatus) => {
    switch (status) {
      case 'won': return 'default'; // Greenish
      case 'lost': return 'destructive'; // Reddish
      case 'pending': return 'outline'; // Yellowish/Orange
      case 'cancelled': return 'secondary'; // Greyish
      default: return 'secondary';
    }
  };
  
  const getStatusIcon = (status: BetStatus) => {
    switch (status) {
      case 'won': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'lost': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'pending': return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />; // Or Clock
      case 'cancelled': return <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />; // Or Ban
      default: return null;
    }
  };


  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-2xl flex items-center text-primary">
          <ListChecks className="mr-3 h-7 w-7" /> Bet History
        </CardTitle>
        <CardDescription>View all user bets and their statuses.</CardDescription>
        <div className="mt-4 relative">
          <Input
            type="search"
            placeholder="Search bets by user, match, sport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 lg:w-1/3 pl-10"
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bet ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Bet On</TableHead>
                <TableHead>Stake</TableHead>
                <TableHead>Odds</TableHead>
                <TableHead>Potential Win</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bet Time</TableHead>
                <TableHead>Resolved Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBets.length > 0 ? filteredBets.map((bet) => (
                <TableRow key={bet.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-xs">{bet.id}</TableCell>
                  <TableCell>
                    <div>{bet.userName}</div>
                    <div className="text-xs text-muted-foreground">{bet.userId}</div>
                  </TableCell>
                  <TableCell>
                     <div>{bet.matchName}</div>
                     <div className="text-xs text-muted-foreground">{bet.sport} - {bet.matchId}</div>
                  </TableCell>
                  <TableCell>{bet.betOn}</TableCell>
                  <TableCell>{bet.stake.toFixed(2)}</TableCell>
                  <TableCell>{bet.odds.toFixed(2)}</TableCell>
                  <TableCell>{bet.potentialWinnings.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(bet.status)}
                      className={cn("capitalize font-medium text-xs flex items-center gap-1", {
                        'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': bet.status === 'won',
                        'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-700/50': bet.status === 'pending',
                        // Destructive for lost
                        'bg-gray-500/20 text-gray-700 border-gray-500/30 dark:text-gray-400 dark:border-gray-700/50': bet.status === 'cancelled',
                      })}
                    >
                      {getStatusIcon(bet.status)}
                      {bet.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{bet.betTime}</TableCell>
                  <TableCell className="text-xs">{bet.resolvedTime || 'N/A'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    No bets found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


    