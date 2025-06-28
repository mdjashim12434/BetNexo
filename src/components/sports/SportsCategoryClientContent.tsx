
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Frown, AlertTriangle, Goal, Bell, Star, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { ProcessedFixture } from '@/types/sportmonks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchLiveFootballFixtures, fetchUpcomingFootballFixtures } from '@/services/sportmonksAPI';


// Helper component from FootballLiveScoresDisplay
const OddsButton = ({ label, value }: { label: string, value?: number }) => {
  if (value === undefined || value === null || value <= 0) return null;
  return (
    <Button variant="outline" className="flex-1 bg-muted/50 h-auto py-1.5 px-2">
      <div className="flex justify-between w-full text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value.toFixed(2)}</span>
      </div>
    </Button>
  );
};

// Card component for Live Matches
const LiveMatchCard = ({ match }: { match: ProcessedFixture }) => (
  <Link href={`/match/${match.id}`} passHref>
    <Card as="a" className="p-3 transition-all hover:bg-muted/50 cursor-pointer">
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-2 truncate">
          <Goal className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold truncate">{match.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          <Bell className="h-4 w-4" />
          <Star className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 w-2/5 truncate">
          <Image src={match.homeTeam.image_path || `https://placehold.co/40x40.png`} alt={match.homeTeam.name} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
          <span className="font-semibold text-sm truncate">{match.homeTeam.name}</span>
        </div>
        <div className="text-xl font-bold text-center">
          {match.homeScore} : {match.awayScore}
        </div>
        <div className="flex items-center gap-2 w-2/5 justify-end truncate">
          <span className="font-semibold text-sm text-right truncate">{match.awayTeam.name}</span>
          <Image src={match.awayTeam.image_path || `https://placehold.co/40x40.png`} alt={match.awayTeam.name} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
        </div>
      </div>
      
      {match.minute && <p className="text-center text-xs text-yellow-500 mb-3">{match.minute}' - {match.state.name}</p>}

      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground">Team Wins</p>
        <div className="flex gap-2">
          <OddsButton label="W1" value={match.odds.home} />
          <OddsButton label="W2" value={match.odds.away} />
        </div>
      </div>
    </Card>
  </Link>
);

// Card component for Upcoming Matches
const UpcomingMatchCard = ({ match }: { match: ProcessedFixture }) => (
  <Link href={`/match/${match.id}`} passHref>
    <Card as="a" className="p-3 transition-all hover:bg-muted/50 cursor-pointer">
       <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-2 truncate">
          <Goal className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold truncate">{match.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <Star className="h-4 w-4" />
        </div>
      </div>
      
       <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-col items-center gap-1 w-2/5 text-center">
          <Image src={match.homeTeam.image_path || `https://placehold.co/40x40.png`} alt={match.homeTeam.name} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
          <span className="font-semibold text-sm truncate">{match.homeTeam.name}</span>
        </div>
        <div className="text-xl font-bold text-muted-foreground">
          VS
        </div>
        <div className="flex flex-col items-center gap-1 w-2/5 text-center">
          <Image src={match.awayTeam.image_path || `https://placehold.co/40x40.png`} alt={match.awayTeam.name} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
          <span className="font-semibold text-sm text-right truncate">{match.awayTeam.name}</span>
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mb-3">{format(new Date(match.startingAt), "dd.MM.yy hh:mm a")}</p>
      
       <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground">1X2</p>
        <div className="flex gap-2">
          <OddsButton label="W1" value={match.odds.home} />
          <OddsButton label="X" value={match.odds.draw} />
          <OddsButton label="W2" value={match.odds.away} />
        </div>
      </div>
    </Card>
  </Link>
);


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
  leagueId?: string;
}

export default function SportsCategoryClientContent({
  categorySlug,
  categoryName,
  leagueId,
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();
  const { toast } = useToast();

  const [liveMatches, setLiveMatches] = useState<ProcessedFixture[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<ProcessedFixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [leagues, setLeagues] = useState<CombinedLeague[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  const getDefaultTab = () => {
    if (categorySlug === 'upcoming') return 'upcoming';
    return 'live';
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Set the active tab based on the category slug, but only if it's different
  useEffect(() => {
    const newDefaultTab = getDefaultTab();
    if (activeTab !== newDefaultTab) {
        setActiveTab(newDefaultTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]);


  useEffect(() => {
    async function getMatchesForCategory() {
      if (categorySlug === 'all-sports') {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setFetchError(null);
      setLiveMatches([]);
      setUpcomingMatches([]);
  
      try {
        const errorMessages: string[] = [];
        const numericLeagueId = leagueId ? Number(leagueId) : undefined;
  
        const handleFetch = <T,>(promise: Promise<T>): Promise<T | []> =>
          promise.catch(e => {
              const message = e instanceof Error ? e.message : String(e);
              console.error(`Error fetching data for ${categorySlug}:`, message);
              errorMessages.push(message);
              return [];
          });
  
        let livePromise: Promise<ProcessedFixture[]> = Promise.resolve([]);
        let upcomingPromise: Promise<ProcessedFixture[]> = Promise.resolve([]);
        
        if (categorySlug === 'live') {
          livePromise = handleFetch(fetchLiveFootballFixtures(numericLeagueId));
        } else if (categorySlug === 'upcoming') {
          upcomingPromise = handleFetch(fetchUpcomingFootballFixtures(numericLeagueId));
        } else if (categorySlug === 'football') {
          livePromise = handleFetch(fetchLiveFootballFixtures(numericLeagueId));
          upcomingPromise = handleFetch(fetchUpcomingFootballFixtures(numericLeagueId));
        }

        const [live, upcoming] = await Promise.all([livePromise, upcomingPromise]);
  
        const liveMatchIds = new Set(live.map(m => m.id));
        const uniqueUpcoming = upcoming.filter(m => !liveMatchIds.has(m.id));
  
        live.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
        uniqueUpcoming.sort((a, b) => new Date(a.startingAt).getTime() - new Date(b.startingAt).getTime());
  
        setLiveMatches(live);
        setUpcomingMatches(uniqueUpcoming);
  
        if (errorMessages.length > 0) {
          setFetchError(errorMessages.join('\n'));
        }
      } catch (e: any) {
        setFetchError(e.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    
    getMatchesForCategory();
  }, [categorySlug, leagueId]);

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
        } else if (leagues.length > 0) {
            const league = leagues.find(l => String(l.id) === leagueId);
            if (league) return league.name;
        }
    }
    return categoryName;
  }, [leagueId, liveMatches, upcomingMatches, categoryName, leagues]);
  
  const filteredLeagues = useMemo(() => {
    if (!searchTerm) return leagues;
    return leagues.filter(league =>
      league.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leagues, searchTerm]);

  const matchesToShow = useMemo(() => {
    let sourceMatches;
    if (categorySlug === 'live') {
        sourceMatches = liveMatches;
    } else if (categorySlug === 'upcoming') {
        sourceMatches = upcomingMatches;
    } else { // football page with tabs
        sourceMatches = activeTab === 'live' ? liveMatches : upcomingMatches;
    }

    if (!searchTerm) return sourceMatches;
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return sourceMatches.filter(match =>
      match.name.toLowerCase().includes(lowercasedSearchTerm) ||
      match.league.name.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [liveMatches, upcomingMatches, searchTerm, activeTab, categorySlug]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return <div className="text-center p-10">Loading user session...</div>
  }

  const showTabs = categorySlug === 'football';

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

  const renderSkeletons = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-3">
                <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-1/4" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-8 w-1/3" />
                </div>
            </Card>
        ))}
    </div>
  );

  const renderMatchList = () => {
    const isLiveList = (categorySlug === 'live') || (categorySlug === 'football' && activeTab === 'live');

    return (
        <div className="space-y-3">
            {matchesToShow.map((match) => 
                isLiveList 
                ? <LiveMatchCard key={`live-${match.id}`} match={match} />
                : <UpcomingMatchCard key={`upcoming-${match.id}`} match={match} />
            )}
        </div>
    );
  }

  const renderNoMatches = () => {
    let message = 'No matches for this selection were found at this time.';
    if(categorySlug === 'live') message = 'No live matches were found at this time.';
    if(categorySlug === 'upcoming') message = 'No upcoming matches were found at this time.';

    return (
      <div className="text-center text-muted-foreground py-10">
        <Frown className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">No Matches Found</p>
        <p className="text-sm">{message}</p>
      </div>
    );
  }

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
              <TabsTrigger value="live">
                  Live <Badge variant="destructive" className="ml-2 animate-pulse">{liveMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                  Upcoming <Badge variant="secondary" className="ml-2">{upcomingMatches.length}</Badge>
              </TabsTrigger>
            </TabsList>
        </Tabs>
      )}

      {isLoading ? renderSkeletons() : fetchError ? (
         <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Failed to load matches</p>
            <p className="text-sm mt-2 max-w-md mx-auto whitespace-pre-wrap">{fetchError}</p>
         </div>
      ) : matchesToShow.length > 0 ? renderMatchList() : renderNoMatches()}
    </div>
  );
}
