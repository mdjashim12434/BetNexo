
'use client';

import { useEffect, useState, useMemo } from 'react';
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
  initialMatches: ProcessedFixture[];
  categorySlug: string;
  categoryName: string;
  error?: string | null;
}

export default function SportsCategoryClientContent({
  initialMatches,
  categorySlug,
  categoryName,
  error,
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loadingAuth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for all-sports leagues
  const [leagues, setLeagues] = useState<CombinedLeague[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const { toast } = useToast();

  const showTabs = categorySlug === 'football' || categorySlug === 'cricket';
  
  const liveCount = useMemo(() => initialMatches.filter(m => m.state?.state === 'INPLAY' || m.state?.state === 'Live').length, [initialMatches]);
  const upcomingCount = useMemo(() => initialMatches.filter(m => m.state?.state !== 'INPLAY' && m.state?.state !== 'Live' && m.state?.state !== 'Finished' && m.state?.state !== 'FT').length, [initialMatches]);

  const [activeTab, setActiveTab] = useState(
    showTabs && liveCount > 0 ? 'live' : 'all'
  );

  const leagueId = searchParams.get('leagueId');
  const displayTitle = useMemo(() => {
    if (leagueId && initialMatches.length > 0) {
      return initialMatches[0].league.name;
    }
    return categoryName;
  }, [leagueId, initialMatches, categoryName]);

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
  
  // Filtered leagues for search
  const filteredLeagues = useMemo(() => {
    if (!searchTerm) return leagues;
    return leagues.filter(league =>
      league.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leagues, searchTerm]);

  const filteredMatches = useMemo(() => {
    let matches = initialMatches;

    if (showTabs) {
      if (activeTab === 'live') {
        matches = matches.filter(m => m.state?.state === 'INPLAY' || m.state?.state === 'Live');
      } else if (activeTab === 'upcoming') {
        matches = matches.filter(m => m.state?.state !== 'INPLAY' && m.state?.state !== 'Live' && m.state?.state !== 'Finished' && m.state?.state !== 'FT');
      }
    }
    
    if (searchTerm) {
      return matches.filter(match =>
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.league.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return matches;
  }, [initialMatches, searchTerm, showTabs, activeTab]);

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

  // Render matches for other categories
  return (
    <div className="space-y-6">
      {sharedHeader}
      
      {showTabs && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                  All <Badge variant="secondary" className="ml-2">{initialMatches.length}</Badge>
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

      {error && (
         <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Failed to load matches</p>
            <p className="text-sm mt-2 max-w-md mx-auto whitespace-pre-wrap">{error}</p>
            <p className="text-xs mt-4 text-muted-foreground">This might be due to an issue with the API provider or an invalid API key.</p>
        </div>
      )}

      {!error && filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <MatchCard key={`${match.sportKey}-${match.id}`} match={match} />
          ))}
        </div>
      ) : !error && (
        <div className="text-center text-muted-foreground py-10">
          <Frown className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">No Matches Found</p>
          <p>No {activeTab !== 'all' ? activeTab : ''} matches for this selection were found at this time. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
