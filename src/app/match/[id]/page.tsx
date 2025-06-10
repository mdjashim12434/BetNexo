'use client';

import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart2, Info, MessageSquare, Users } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { Match } from '@/components/sports/MatchCard'; // Assuming Match type is exported
import { useEffect, useState } from 'react';

// Mock function to get match details by ID
const getMatchDetails = async (id: string): Promise<Match | null> => {
  // In a real app, fetch this from an API or Opticodds
  const mockMatches: Match[] = [
    { id: '1', teamA: 'India', teamB: 'Australia', time: '14:00 Local', sport: 'Cricket', league: 'World Cup', oddsA: '1.80', oddsB: '2.10', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Cricket+Stadium' },
    { id: '3', teamA: 'Real Madrid', teamB: 'Barcelona', time: 'Tomorrow 19:00 GMT', sport: 'Football', league: 'La Liga', oddsA: '2.20', oddsDraw: '3.20', oddsB: '3.00', status: 'upcoming', imageUrl: 'https://placehold.co/800x400.png?text=Football+Pitch' },
    { id: '4', teamA: 'Man City', teamB: 'Liverpool', time: 'LIVE', sport: 'Football', league: 'Premier League', oddsA: '1.90', oddsDraw: '3.60', oddsB: '3.80', status: 'live', imageUrl: 'https://placehold.co/800x400.png?text=Live+Football+Action' },
  ];
  return mockMatches.find(m => m.id === id) || null;
};


export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = typeof params.id === 'string' ? params.id : '';
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      getMatchDetails(matchId).then(data => {
        setMatch(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [matchId]);

  if (loading) {
    return <AppLayout><div className="text-center p-10">Loading match details...</div></AppLayout>;
  }

  if (!match) {
    return <AppLayout><div className="text-center p-10">Match not found.</div></AppLayout>;
  }
  
  const isLive = match.status === 'live';

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
        </Button>

        <Card className="overflow-hidden shadow-xl">
          {match.imageUrl && (
            <div className="relative h-64 w-full">
              <Image src={match.imageUrl} alt={`${match.teamA} vs ${match.teamB}`} layout="fill" objectFit="cover" data-ai-hint={`${match.sport} action`} />
               {isLive && (
                <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 text-sm font-bold rounded animate-pulse">LIVE</span>
              )}
            </div>
          )}
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{match.teamA} vs {match.teamB}</CardTitle>
            <CardDescription className="text-lg">{match.league} - {match.sport} | {match.time}</CardDescription>
             {!match.imageUrl && isLive && (
                <span className="w-fit bg-red-600 text-white px-3 py-1.5 text-sm font-bold rounded animate-pulse">LIVE</span>
              )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="odds" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                <TabsTrigger value="odds">Odds</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
              <TabsContent value="odds">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Betting Odds</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Button variant="outline" size="lg" className="h-auto py-3">
                        <div className="flex flex-col items-center">
                          <span className="text-sm text-muted-foreground">{match.teamA} to Win</span>
                          <span className="text-xl font-bold">{match.oddsA || 'N/A'}</span>
                        </div>
                      </Button>
                       {match.oddsDraw && (
                        <Button variant="outline" size="lg" className="h-auto py-3">
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-muted-foreground">Draw</span>
                            <span className="text-xl font-bold">{match.oddsDraw}</span>
                          </div>
                        </Button>
                      )}
                      <Button variant="outline" size="lg" className="h-auto py-3">
                        <div className="flex flex-col items-center">
                          <span className="text-sm text-muted-foreground">{match.teamB} to Win</span>
                          <span className="text-xl font-bold">{match.oddsB || 'N/A'}</span>
                        </div>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Odds are subject to change. Please bet responsibly.</p>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Place Bet Now</Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stats">
                <Card>
                  <CardHeader><CardTitle className="font-headline flex items-center"><BarChart2 className="mr-2 h-5 w-5"/>Match Statistics</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Detailed match statistics will be available here. (e.g., possession, shots, score history)</p>
                    {/* Placeholder for stats */}
                    <div className="mt-4 space-y-2">
                        <p>Possession: {match.teamA} 55% - {match.teamB} 45%</p>
                        <p>Score: {match.teamA} 1 - {match.teamB} 0 (If live)</p>
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
                        <p>Referee: John Smith</p>
                        <p>Weather: Clear, 25°C</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="chat">
                <Card>
                  <CardHeader><CardTitle className="font-headline flex items-center"><MessageSquare className="mr-2 h-5 w-5"/>Live Chat</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Live chat feature coming soon! Discuss the match with other fans.</p>
                    {/* Placeholder for chat */}
                     <div className="mt-4 h-40 border rounded p-2 overflow-y-auto">
                        <p className="text-sm">Fan123: Go Team A!</p>
                        <p className="text-sm">ProBetPlayer: Team B looks strong today.</p>
                    </div>
                    <Input placeholder="Type your message..." className="mt-2" />
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
