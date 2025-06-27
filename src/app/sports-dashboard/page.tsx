
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Frown, Loader2, ChevronsRight } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Match {
    id: number;
    home_team: string;
    away_team: string;
    date: string;
    time: string;
    sport: 'football' | 'cricket';
}

interface League {
    id: number;
    name: string;
    sport: 'football' | 'cricket';
}

interface OddsData {
    marketName: string;
    oddValue: string;
}


export default function SportsDashboardPage() {
  const [view, setView] = useState('live');
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [odds, setOdds] = useState<Record<number, OddsData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMatches([]);
    setLeagues([]);

    try {
        let url = '';
        if (view === 'live') url = '/api/live-matches';
        else if (view === 'upcoming') url = '/api/upcoming-matches';
        else if (view === 'leagues') url = '/api/leagues';
        
        if (!url) {
            setLoading(false);
            return;
        }

        const res = await fetch(url);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to fetch data');
        }
        const data = await res.json();
        
        if (view === 'leagues') {
            setLeagues(data);
        } else {
            setMatches(data);
        }
    } catch (e: any) {
        setError(e.message);
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  }, [view, toast]);

  useEffect(() => {
      if (user) {
        fetchData();
      }
  }, [view, user, fetchData]);

  const fetchFixturesByLeague = async (league: League) => {
    setLoading(true);
    setError(null);
    setView('league-fixtures'); // A temporary view state
    try {
        const res = await fetch(`/api/fixtures-by-league?league_id=${league.id}&sport=${league.sport}`);
        if (!res.ok) throw new Error('Failed to fetch league fixtures');
        const data = await res.json();
        setMatches(data);
    } catch (e: any) {
        setError(e.message);
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  const fetchOdds = async (fixtureId: number, sport: 'football' | 'cricket') => {
    if (odds[fixtureId]) return; // Don't fetch if already present
    
    // Show loading state for odds
    setOdds(prev => ({...prev, [fixtureId]: []})); // Empty array indicates loading

    try {
        const res = await fetch(`/api/odds/${fixtureId}?sport=${sport}`);
        if (!res.ok) throw new Error('Failed to fetch odds');
        const data = await res.json();
        setOdds(prev => ({ ...prev, [fixtureId]: data }));
    } catch (e: any) {
        toast({ title: 'Odds Error', description: e.message, variant: 'destructive' });
        setOdds(prev => ({ ...prev, [fixtureId]: [{ marketName: 'Error', oddValue: 'N/A'}] }));
    }
  };
  
  const renderMatches = () => (
      matches.map(match => (
          <Accordion key={match.id} type="single" collapsible className="w-full">
            <AccordionItem value={`item-${match.id}`} className="border rounded-md mb-2 px-4 bg-card">
              <AccordionTrigger onClick={() => fetchOdds(match.id, match.sport)}>
                <div className="text-left">
                  <p className="font-semibold">{match.home_team} vs {match.away_team}</p>
                  <p className="text-xs text-muted-foreground">{match.date} - {match.time}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {odds[match.id] ? (
                    odds[match.id].length > 0 ? (
                        <div className="pt-2 border-t">
                            <h4 className="font-semibold mb-2 text-primary">Available Odds</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {odds[match.id].map(odd => (
                                <div key={odd.marketName} className="flex justify-between p-2 bg-muted rounded">
                                    <span>{odd.marketName}</span>
                                    <span className="font-bold">{odd.oddValue}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="ml-2">Loading Odds...</span>
                        </div>
                    )
                ) : (
                    <p className="text-muted-foreground text-center p-2">Click trigger to view odds.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
      ))
  );

  const renderContent = () => {
    if (loading) {
        return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    if (error) {
        return <div className="text-center text-destructive p-10 bg-destructive/10 rounded-lg"><AlertTriangle className="mx-auto h-8 w-8 mb-2" />{error}</div>;
    }
    if (view === 'leagues') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {leagues.map(league => (
                    <Button key={league.id} variant="outline" className="justify-between h-auto py-3" onClick={() => fetchFixturesByLeague(league)}>
                        <span className="text-left flex-1">{league.name}</span>
                        <ChevronsRight className="h-4 w-4 ml-2" />
                    </Button>
                ))}
            </div>
        )
    }
    if (matches.length === 0) {
        return <div className="text-center text-muted-foreground p-10"><Frown className="mx-auto h-8 w-8 mb-2" />No matches found for this view.</div>;
    }
    return <div className="space-y-2">{renderMatches()}</div>;
  };
  
  if (loadingAuth && !user) {
      return (
          <AppLayout>
              <div className="container py-6 space-y-4">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-64 w-full" />
              </div>
          </AppLayout>
      )
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Sports Dashboard</CardTitle>
                <CardDescription>View live matches, upcoming fixtures, and browse all leagues.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Button onClick={() => setView('live')} variant={view === 'live' ? 'default' : 'outline'}>Live</Button>
                    <Button onClick={() => setView('upcoming')} variant={view === 'upcoming' ? 'default' : 'outline'}>Upcoming</Button>
                    <Button onClick={() => setView('leagues')} variant={view === 'leagues' ? 'default' : 'outline'}>All Leagues</Button>
                </div>
                <div>{renderContent()}</div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
