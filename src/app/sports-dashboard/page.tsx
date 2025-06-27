
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Frown, Loader2, ArrowRight } from "lucide-react";
import {
  fetchLiveFootballFixtures,
  fetchUpcomingFootballFixtures,
  fetchLiveCricketFixtures,
  fetchUpcomingCricketFixtures,
} from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';
import MatchCard from '@/components/sports/MatchCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ApiLeague {
  id: number;
  name: string;
}

interface CombinedLeague {
  id: number;
  name: string;
  sport: 'football' | 'cricket';
}

type ViewType = 'live' | 'upcoming' | 'leagues';

export default function SportsDashboardPage() {
  const [activeTab, setActiveTab] = useState<ViewType>('live');
  
  const [liveMatches, setLiveMatches] = useState<ProcessedFixture[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<ProcessedFixture[]>([]);
  const [leagues, setLeagues] = useState<CombinedLeague[]>([]);
  
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

  const handleFetchError = useCallback((e: any, type: ViewType) => {
    const message = e.message || `An error occurred while fetching ${type} data.`;
    console.error(`Error fetching ${type} data:`, e);
    setError(message);
    toast({ title: "Data Fetch Error", description: message, variant: "destructive" });
  }, [toast]);

  const fetchLiveData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const livePromises = [
        fetchLiveFootballFixtures(),
        fetchLiveCricketFixtures(),
      ];
      const liveResults = await Promise.allSettled(livePromises);
      const combinedLiveMatches = liveResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => (r as PromiseFulfilledResult<ProcessedFixture[]>).value)
        .sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
      setLiveMatches(combinedLiveMatches);
    } catch (e: any) {
      handleFetchError(e, 'live');
    } finally {
      setLoading(false);
    }
  }, [user, handleFetchError]);

  const fetchUpcomingData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const upcomingPromises = [
          fetchUpcomingFootballFixtures(),
          fetchUpcomingCricketFixtures(),
      ];
      const upcomingResults = await Promise.allSettled(upcomingPromises);
      const combinedUpcomingMatches = upcomingResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => (r as PromiseFulfilledResult<ProcessedFixture[]>).value)
        .sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());

      const liveMatchIds = new Set(liveMatches.map(m => m.id));
      const uniqueUpcoming = combinedUpcomingMatches.filter(m => !liveMatchIds.has(m.id));
      setUpcomingMatches(uniqueUpcoming);

    } catch (e: any) {
      handleFetchError(e, 'upcoming');
    } finally {
      setLoading(false);
    }
  }, [user, liveMatches, handleFetchError]);

  const fetchLeaguesData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const leaguesResponse = await fetch('/api/all-sports/leagues');
      if (!leaguesResponse.ok) throw new Error('Failed to fetch leagues');
      const leaguesData: { footballLeagues: ApiLeague[], cricketLeagues: ApiLeague[] } = await leaguesResponse.json();
      const combinedLeagues: CombinedLeague[] = [
          ...(leaguesData.footballLeagues || []).map(l => ({ id: l.id, name: l.name, sport: 'football' as const })),
          ...(leaguesData.cricketLeagues || []).map(l => ({ id: l.id, name: l.name, sport: 'cricket' as const }))
      ].sort((a, b) => a.name.localeCompare(b.name));
      setLeagues(combinedLeagues);
    } catch (e: any) {
      handleFetchError(e, 'leagues');
    } finally {
      setLoading(false);
    }
  }, [user, handleFetchError]);
  
  useEffect(() => {
    if (user) {
      if (activeTab === 'live' && liveMatches.length === 0) {
        fetchLiveData();
      } else if (activeTab === 'upcoming' && upcomingMatches.length === 0) {
        if (liveMatches.length === 0) {
          fetchLiveData().then(() => fetchUpcomingData());
        } else {
          fetchUpcomingData();
        }
      } else if (activeTab === 'leagues' && leagues.length === 0) {
        fetchLeaguesData();
      }
    }
  }, [activeTab, user, liveMatches.length, upcomingMatches.length, leagues.length, fetchLiveData, fetchUpcomingData, fetchLeaguesData]);


  if (loadingAuth) {
    return (
        <AppLayout>
            <div className="container py-6 space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
            </div>
        </AppLayout>
    );
  }

  const renderContent = (
    data: ProcessedFixture[] | CombinedLeague[],
    type: ViewType
  ) => {
    if (loading) {
      const skeletonCount = type === 'leagues' ? 10 : 6;
      const SkeletonComponent = type === 'leagues' ? <Skeleton className="h-12 w-full" /> : <Skeleton className="h-64 w-full" />;
      const gridClass = type === 'leagues' ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      
      return (
        <div className={gridClass}>
          {[...Array(skeletonCount)].map((_, i) => <React.Fragment key={i}>{SkeletonComponent}</React.Fragment>)}
        </div>
      );
    }

    if (error) {
         return (
             <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                  <p className="text-lg font-semibold">Failed to load data</p>
                  <p className="text-sm mt-2 max-w-md mx-auto">{error}</p>
                </div>
         );
    }

    if (data.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <Frown className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">No {type} found.</p>
            </div>
        );
    }

    if (type === 'leagues') {
       return (
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {(data as CombinedLeague[]).map(league => (
                  <li key={`${league.sport}-${league.id}`}>
                    <Link 
                      href={`/sports/${league.sport}?leagueId=${league.id}`}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 border transition-colors"
                    >
                      <span className="font-medium">{league.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={league.sport === 'football' ? 'default' : 'secondary'} className="capitalize">{league.sport}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
      );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data as ProcessedFixture[]).map((match) => <MatchCard key={match.id} match={match} />)}
        </div>
    );
  };
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Sports Dashboard</CardTitle>
              <CardDescription>View live matches, upcoming fixtures, and browse all leagues.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewType)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="live">Live</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="leagues">All Leagues</TabsTrigger>
                </TabsList>
                <TabsContent value="live" className="mt-4">
                  {renderContent(liveMatches, 'live')}
                </TabsContent>
                <TabsContent value="upcoming" className="mt-4">
                  {renderContent(upcomingMatches, 'upcoming')}
                </TabsContent>
                <TabsContent value="leagues" className="mt-4">
                  {renderContent(leagues, 'leagues')}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
