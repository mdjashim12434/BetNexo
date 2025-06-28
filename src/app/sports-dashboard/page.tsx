
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Frown, Loader2, ChevronsRight, ChevronDown, ChevronUp, Radio, Calendar, Trophy } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Match {
    id: number;
    home_team: string;
    away_team: string;
    date: string;
    time: string;
    sport: 'football';
}

interface League {
    id: number;
    name: string;
}

interface OddsData {
    marketName: string;
    oddValue: string;
}

type ViewState = 'live' | 'upcoming' | 'leagues' | 'league-fixtures';

export default function SportsDashboardPage() {
  const [view, setView] = useState<ViewState>('live');
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [odds, setOdds] = useState<Record<number, OddsData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeagueName, setSelectedLeagueName] = useState('');
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [loadingOdds, setLoadingOdds] = useState<Set<number>>(new Set());

  const { user, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  const fetchData = useCallback(async (currentView: ViewState) => {
    setLoading(true);
    setError(null);
    setMatches([]);
    // Do not clear leagues when switching to live/upcoming
    if (currentView === 'leagues') setLeagues([]);

    try {
        let url = '';
        if (currentView === 'live') url = '/api/live-matches';
        else if (currentView === 'upcoming') url = '/api/upcoming-matches';
        else if (currentView === 'leagues') url = '/api/leagues';
        
        if (!url) {
            setLoading(false);
            return;
        }

        const res = await fetch(url);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || `Failed to fetch ${currentView} data`);
        }
        const data = await res.json();
        
        if (currentView === 'leagues') {
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
  }, [toast]);

  useEffect(() => {
      if (user && (view === 'live' || view === 'upcoming' || view === 'leagues')) {
        fetchData(view);
      }
  }, [view, user, fetchData]);

  const fetchFixturesByLeague = async (league: League) => {
    setLoading(true);
    setError(null);
    setMatches([]);
    setView('league-fixtures');
    setSelectedLeagueName(league.name);
    try {
        const res = await fetch(`/api/fixtures-by-league?league_id=${league.id}`);
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

  const toggleOdds = async (matchId: number) => {
    if (expandedMatch === matchId) {
        setExpandedMatch(null);
        return;
    }

    setExpandedMatch(matchId);
    if (odds[matchId]) return; // Don't re-fetch if already present

    setLoadingOdds(prev => new Set(prev.add(matchId)));
    try {
        const res = await fetch(`/api/odds/${matchId}`);
        if (!res.ok) throw new Error('Failed to fetch odds');
        const data = await res.json();
        setOdds(prev => ({ ...prev, [matchId]: data }));
    } catch (e: any) {
        toast({ title: 'Odds Error', description: e.message, variant: 'destructive' });
        setOdds(prev => ({ ...prev, [matchId]: [{ marketName: 'Error fetching odds', oddValue: 'N/A'}] }));
    } finally {
        setLoadingOdds(prev => {
            const newSet = new Set(prev);
            newSet.delete(matchId);
            return newSet;
        });
    }
  };

  const getTitle = () => {
    if(view === 'league-fixtures') return selectedLeagueName;
    if(view === 'live') return 'Live Matches';
    if(view === 'upcoming') return 'Upcoming Matches';
    if(view === 'leagues') return 'All Leagues';
    return 'Sports Dashboard';
  }
  
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
                {leagues.length > 0 ? leagues.map(league => (
                    <Button key={league.id} variant="outline" className="justify-between h-auto py-3 text-left" onClick={() => fetchFixturesByLeague(league)}>
                        <span className="flex-1">{league.name}</span>
                        <ChevronsRight className="h-4 w-4 ml-2" />
                    </Button>
                )) : <div className="text-center text-muted-foreground p-10 col-span-full"><Frown className="mx-auto h-8 w-8 mb-2" />No leagues found.</div>}
            </div>
        )
    }

    if (matches.length === 0) {
        return <div className="text-center text-muted-foreground p-10"><Frown className="mx-auto h-8 w-8 mb-2" />No matches found for this view.</div>;
    }
    
    return (
        <div className="space-y-3">
            {matches.map(match => (
                <Card key={match.id} className="bg-card">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{match.home_team} vs {match.away_team}</p>
                                <p className="text-xs text-muted-foreground">{new Date(match.date).toLocaleDateString()} - {match.time}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toggleOdds(match.id)} className="w-28">
                                {loadingOdds.has(match.id) ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                 expandedMatch === match.id ? <><ChevronUp className="h-4 w-4 mr-1"/> Hide Odds</> : <><ChevronDown className="h-4 w-4 mr-1"/> Show Odds</>
                                }
                            </Button>
                        </div>
                        {expandedMatch === match.id && (
                            <div className="mt-4 pt-4 border-t">
                                {odds[match.id] ? (
                                    odds[match.id].length > 0 && odds[match.id][0].marketName !== 'Error fetching odds' ? (
                                        <>
                                            <h4 className="font-semibold mb-2 text-primary">Available Odds</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                                {odds[match.id].map(odd => (
                                                    <div key={odd.marketName} className="flex justify-between p-2 bg-muted rounded">
                                                        <span>{odd.marketName}</span>
                                                        <span className="font-bold">{odd.oddValue}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-center text-muted-foreground">No odds available for this match.</p>
                                    )
                                ) : (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="ml-2">Loading Odds...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
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
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{getTitle()}</CardTitle>
                <CardDescription>View live matches, upcoming fixtures, and browse all leagues.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4 border-b pb-4">
                    <Button onClick={() => setView('live')} variant={view === 'live' ? 'default' : 'outline'}><Radio />Live</Button>
                    <Button onClick={() => setView('upcoming')} variant={view === 'upcoming' ? 'default' : 'outline'}><Calendar />Upcoming</Button>
                    <Button onClick={() => setView('leagues')} variant={view === 'leagues' ? 'default' : 'outline'}><Trophy />All Leagues</Button>
                </div>
                <div>{renderContent()}</div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
