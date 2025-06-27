
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  sport: 'football';
}

interface SportsCategoryClientContentProps {
  categorySlug: string;
  categoryName: string;
  initialLiveMatches: ProcessedFixture[];
  initialUpcomingMatches: ProcessedFixture[];
  initialError: string | null;
  leagueId?: string;
}

export default function SportsCategoryClientContent({
  categorySlug,
  categoryName,
  initialLiveMatches,
  initialUpcomingMatches,
  initialError,
  leagueId,
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();
  const { toast } = useToast();

  // Separate states for live and upcoming matches, as requested.
  const [liveMatches, setLiveMatches] = useState<ProcessedFixture[]>(initialLiveMatches);
  const [upcomingMatches, setUpcomingMatches] = useState<ProcessedFixture[]>(initialUpcomingMatches);
  const [fetchError, setFetchError] = useState<string | null>(initialError);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [leagues, setLeagues] = useState<CombinedLeague[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  const showTabs = categorySlug === 'football' || categorySlug === 'live' || categorySlug === 'upcoming';
  
  // Default active tab logic
  const getDefaultTab = () => {
    if (categorySlug === 'live') return 'live';
    if (categorySlug === 'upcoming') return 'upcoming';
    return initialLiveMatches.length > 0 ? 'live' : 'upcoming';
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());
   
  // When category changes, reset the active tab appropriately
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [categorySlug, initialLiveMatches.length]);


  useEffect(() => {
    if (categorySlug === 'all-sports') {
      setLoadingLeagues(true);
      fetch('/api/all-sports/leagues')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch leagues');
          return res.json();
        })
        .then((data: { leagues: ApiLeague[] }) => {
          const combined: CombinedLeague[] = (data.leagues || []).map(l => ({ 
            id: l.id, 
            name: l.name, 
            sport: 'football' as const 
          }));
          combined.sort((a, b) => a.name.localeCompare(b.name));
          setLeagues(combined);
        })
        .catch(err => toast({ title: "Error Loading Leagues", description: err.message, variant: "destructive" }))
        .finally(() => setLoadingLeagues(false));
    }
  }, [categorySlug, toast]);
  
  const displayTitle = useMemo(() => {
    if (leagueId) {
        const allMatches = [...liveMatches, ...upcomingMatches];
        const matchWithLeague = allMatches.find(m => m.league && m.league.name !== 'N/A');
        if (matchWithLeague) {
            return matchWithLeague.league.name;
        }
    }
    return categoryName;
  }, [leagueId, liveMatches, upcomingMatches, categoryName]);
  
  const filteredLeagues = useMemo(() => {
    if (!searchTerm) return leagues;
    return leagues.filter(league =>
      league.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leagues, searchTerm]);

  // Refactored logic to handle separate states and filtering
  const filteredMatches = useMemo(() => {
    let sourceMatches: ProcessedFixture[] = [];
    
    // Determine the source array based on the active tab
    if (activeTab === 'live') {
      sourceMatches = liveMatches;
    } else if (activeTab === 'upcoming') {
      sourceMatches = upcomingMatches;
    }
    
    // Apply search filter if a search term exists
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      return sourceMatches.filter(match =>
        match.name.toLowerCase().includes(lowercasedSearchTerm) ||
        match.league.name.toLowerCase().includes(lowercasedSearchTerm)
      );
    }
    
    return sourceMatches;
  }, [liveMatches, upcomingMatches, searchTerm, activeTab]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-9 w-1/2" />
            </div>
             <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card">
               <Skeleton className="h-10 flex-grow" />
             </div>
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
                      <Badge variant={'default'} className="capitalize">{league.sport}</Badge>
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

  return (
    <div className="space-y-6">
      {sharedHeader}
      
      {showTabs && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="live" disabled={categorySlug === 'upcoming'}>
                  Live <Badge variant="destructive" className="ml-2 animate-pulse">{liveMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" disabled={categorySlug === 'live'}>
                  Upcoming <Badge variant="secondary" className="ml-2">{upcomingMatches.length}</Badge>
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
          <p>No {activeTab} matches for this selection were found at this time. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
