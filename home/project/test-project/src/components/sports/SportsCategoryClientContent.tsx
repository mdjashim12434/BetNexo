
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Frown, AlertTriangle, Goal, Bell, Star } from 'lucide-react';
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
  initialLiveMatches: ProcessedFixture[];
  initialUpcomingMatches: ProcessedFixture[];
  initialError: string | null;
}

export default function SportsCategoryClientContent({
  categorySlug,
  categoryName,
  leagueId,
  initialLiveMatches,
  initialUpcomingMatches,
  initialError
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();
  const { toast } = useToast();

  const [liveMatches, setLiveMatches] = useState<ProcessedFixture[]>(initialLiveMatches);
  const [upcomingMatches, setUpcomingMatches] = useState<ProcessedFixture[]>(initialUpcomingMatches);
  const [fetchError, setFetchError] = useState<string | null>(initialError);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [leagues, setLeagues] = useState<CombinedLeague[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  const getDefaultTab = () => {
    if (categorySlug === 'upcoming' && upcomingMatches.length > 0 && liveMatches.length === 0) return 'upcoming';
    return 'live';
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // This effect ensures state is updated if props change, e.g., on client-side navigation
  useEffect(() => {
    setLiveMatches(initialLiveMatches);
    setUpcomingMatches(initialUpcomingMatches);
    setFetchError(initialError);
  }, [initialLiveMatches, initialUpcomingMatches, initialError]);


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
    if(categorySlug === 'live' || (categorySlug === 'football' && activeTab === 'live')) message = 'No live matches were found at this time.';
    if(categorySlug === 'upcoming' || (categorySlug === 'football' && activeTab === 'upcoming')) message = 'No upcoming matches were found at this time.';

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

      {fetchError ? (
         <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Failed to load matches</p>
            <p className="text-sm mt-2 max-w-md mx-auto whitespace-pre-wrap">{fetchError}</p>
         </div>
      ) : matchesToShow.length > 0 ? renderMatchList() : renderNoMatches()}
    </div>
  );
}
