
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MatchCard from '@/components/sports/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Frown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { ProcessedFixture } from '@/types/sportmonks';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  fetchUpcomingFootballFixtures,
  fetchUpcomingCricketFixtures,
  fetchLiveFootballFixtures,
  fetchLiveCricketFixtures,
} from '@/services/sportmonksAPI';

// Interfaces for leagues
interface ApiLeague {
  id: number;
  name: string;
}

interface CombinedLeague {
  id: number;
  name: string;
  sport: 'football' | 'cricket';
}

interface SportsCategoryClientContentProps {
  categorySlug: string;
  categoryName: string;
}

export default function SportsCategoryClientContent({
  categorySlug,
  categoryName,
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loadingAuth } = useAuth();
  const { toast } = useToast();

  const [matches, setMatches] = useState<ProcessedFixture[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for all-sports leagues
  const [leagues, setLeagues] = useState<CombinedLeague[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  const showTabs = categorySlug === 'football' || categorySlug === 'cricket';
  
  const liveCount = useMemo(() => matches.filter(m => m.state?.state === 'INPLAY' || m.state?.state === 'Live').length, [matches]);
  const upcomingCount = useMemo(() => matches.filter(m => m.state?.state !== 'INPLAY' && m.state?.state !== 'Live' && m.state?.state !== 'Finished' && m.state?.state !== 'FT').length, [matches]);

  const [activeTab, setActiveTab] = useState('all');

  const leagueId = searchParams.get('leagueId');

  // Fetch leagues if on the all-sports page
  useEffect(() => {
    if (categorySlug === 'all-sports') {
      const fetchLeagues = async () => {
        setLoadingLeagues(true);
        try {
          const res = await fetch('/api/all-sports/leagues');
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch leagues from the server.');
          }
          const data: { footballLeagues: ApiLeague[], cricketLeagues: ApiLeague[] } = await res.json();
          
          const combined: CombinedLeague[] = [
            ...(data.footballLeagues || []).map(l => ({ id: l.id, name: l.name, sport: 'football' as const })),
            ...(data.cricketLeagues || []).map(l => ({ id: l.id, name: l.name, sport: 'cricket' as const }))
          ];

          combined.sort((a, b) => a.name.localeCompare(b.name));
          setLeagues(combined);
        } catch (err: any) {
          toast({
            title: "Error Loading Leagues",
            description: err.message,
            variant: "destructive"
          });
        } finally {
          setLoadingLeagues(false);
        }
      };
      fetchLeagues();
    }
  }, [categorySlug, toast]);

  const fetchMatchesData = useCallback(async () => {
    if (categorySlug === 'all-sports') {
      setLoadingMatches(false);
      return;
    }

    setLoadingMatches(true);
    setFetchError(null);
    
    let matchesForCategory: ProcessedFixture[] = [];
    const errorMessages: string[] = [];
    const leagueIdNum = leagueId ? Number(leagueId) : undefined;

    const handleFetchError = (sport: string, type: string, e: any) => {
        const message = e.message || `Unknown error fetching ${type} ${sport} fixtures.`;
        console.error(`Failed to fetch ${type} ${sport} fixtures:`, message);
        errorMessages.push(`Could not load ${type} ${sport} matches.`);
        return [];
    };

    try {
        if (categorySlug === 'live') {
            const [footballMatches] = await Promise.all([
                fetchLiveFootballFixtures(leagueIdNum).catch((e) => handleFetchError('football', 'live', e)),
            ]);
            matchesForCategory = [...footballMatches];
        } else if (categorySlug === 'football') {
            const [liveMatches, upcomingMatches] = await Promise.all([
                fetchLiveFootballFixtures(leagueIdNum).catch((e) => handleFetchError('football', 'live', e)),
                fetchUpcomingFootballFixtures(leagueIdNum).catch((e) => handleFetchError('football', 'upcoming', e)),
            ]);
            matchesForCategory = [...liveMatches, ...upcomingMatches];
        } else if (categorySlug === 'cricket') {
            const [upcomingMatches] = await Promise.all([
                fetchUpcomingCricketFixtures(leagueIdNum).catch((e) => handleFetchError('cricket', 'upcoming', e)),
            ]);
            matchesForCategory = [...upcomingMatches];
        } else if (categorySlug === 'upcoming') {
            const [footballMatches, cricketMatches] = await Promise.all([
                fetchUpcomingFootballFixtures(leagueIdNum).catch((e) => handleFetchError('football', 'upcoming', e)),
                fetchUpcomingCricketFixtures(leagueIdNum).catch((e) => handleFetchError('cricket', 'upcoming', e)),
            ]);
            matchesForCategory = [...footballMatches, ...cricketMatches];
        }

        if (errorMessages.length > 0) {
            setFetchError(errorMessages.join('\n'));
        }

        matchesForCategory.sort((a, b) => {
            const aIsLive = a.state?.state === 'INPLAY' || a.state?.state === 'Live';
            const bIsLive = b.state?.state === 'INPLAY' || b.state?.state === 'Live';
            if (aIsLive && !bIsLive) return -1;
            if (!aIsLive && bIsLive) return 1;
            return new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime();
        });

        setMatches(matchesForCategory);

    } catch (error: any) {
        console.error(`A top-level error occurred while fetching fixtures for ${categorySlug}:`, error);
        setFetchError(error.message || `An unknown error occurred while fetching matches for ${categorySlug}.`);
    } finally {
        setLoadingMatches(false);
    }
  }, [categorySlug, leagueId]);

  useEffect(() => {
    fetchMatchesData();
  }, [fetchMatchesData]);
  
  const displayTitle = useMemo(() => {
    if (leagueId && matches.length > 0) {
      return matches[0].league.name;
    }
    return categoryName;
  }, [leagueId, matches, categoryName]);
  
  // Filtered leagues for search
  const filteredLeagues = useMemo(() => {
    if (!searchTerm) return leagues;
    return leagues.filter(league =>
      league.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leagues, searchTerm]);

  const filteredMatches = useMemo(() => {
    let currentMatches = matches;

    if (showTabs) {
      if (activeTab === 'live') {
        currentMatches = currentMatches.filter(m => m.state?.state === 'INPLAY' || m.state?.state === 'Live');
      } else if (activeTab === 'upcoming') {
        currentMatches = currentMatches.filter(m => m.state?.state !== 'INPLAY' && m.state?.state !== 'Live' && m.state?.state !== 'Finished' && m.state?.state !== 'FT');
      }
    }
    
    if (searchTerm) {
      return currentMatches.filter(match =>
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.league.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return currentMatches;
  }, [matches, searchTerm, showTabs, activeTab]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return <div className="text-center p-10">Loading session...</div>;
  }
  if (!user && !loadingAuth) {
    return <div className="text-center p-10">Redirecting to login...</div>;
  }

  const sharedHeader = (
     <>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="self-start sm:self-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="font-headline text-3xl font-bold text-center sm:text-left flex-grow">
          {displayTitle}
        </h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={categorySlug === 'all-sports' ? "Search by League Name..." : "Search by Team or League..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
    </>
  );

  // Render leagues for 'all-sports' page
  if (categorySlug === 'all-sports') {
    return (
      <div className="space-y-6">
        {sharedHeader}
        {loadingLeagues ? (
          <Card>
            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
            <CardContent className="space-y-3 p-4">
              {[...Array(15)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        ) : filteredLeagues.length > 0 ? (
          <Card>
            <CardHeader><CardTitle>All Available Leagues</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {filteredLeagues.map(league => (
                  <li key={`${league.sport}-${league.id}`}>
                    <Link 
                      href={`/sports/${league.sport}?leagueId=${league.id}`}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 border transition-colors"
                    >
                      <span className="font-medium">{league.name}</span>
                      <Badge variant={league.sport === 'football' ? 'default' : 'secondary'} className="capitalize">{league.sport}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <Frown className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">No Leagues Found</p>
            <p className="text-sm">Could not retrieve league information at this time.</p>
          </div>
        )}
      </div>
    );
  }

  // Loading state for match categories
  if (loadingMatches) {
     return (
        <div className="space-y-6">
            {sharedHeader}
            {showTabs && (
              <Tabs value={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all"><Skeleton className="h-4 w-20" /></TabsTrigger>
                  <TabsTrigger value="live"><Skeleton className="h-4 w-20" /></TabsTrigger>
                  <TabsTrigger value="upcoming"><Skeleton className="h-4 w-20" /></TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  // Render matches for other categories
  return (
    <div className="space-y-6">
      {sharedHeader}
      
      {showTabs && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                  All <Badge variant="secondary" className="ml-2">{matches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="live" disabled={liveCount === 0}>
                  Live <Badge variant="destructive" className="ml-2 animate-pulse">{liveCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" disabled={upcomingCount === 0}>
                  Upcoming <Badge variant="secondary" className="ml-2">{upcomingCount}</Badge>
              </TabsTrigger>
            </TabsList>
        </Tabs>
      )}

      {fetchError && (
         <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Failed to load matches</p>
            <p className="text-sm mt-2 max-w-md mx-auto whitespace-pre-wrap">{fetchError}</p>
            <p className="text-xs mt-4 text-muted-foreground">This might be due to an issue with the API provider or an invalid API key.</p>
        </div>
      )}

      {!fetchError && filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <MatchCard key={`${match.sportKey}-${match.id}`} match={match} />
          ))}
        </div>
      ) : !fetchError && (
        <div className="text-center text-muted-foreground py-10">
          <Frown className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">No Matches Found</p>
          <p>No {activeTab !== 'all' ? activeTab : ''} matches for this selection were found at this time. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
