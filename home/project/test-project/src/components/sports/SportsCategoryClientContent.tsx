
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Frown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { ProcessedFixture } from '@/types/sportmonks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MatchCard from '@/components/sports/MatchCard';

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
  initialLeagues: CombinedLeague[];
  initialError: string | null;
}

export default function SportsCategoryClientContent({
  categorySlug,
  categoryName,
  leagueId,
  initialLiveMatches,
  initialUpcomingMatches,
  initialLeagues,
  initialError
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data is now passed via props, so internal loading state is not required.
  const isLoading = false; 

  const getDefaultTab = () => {
    if (categorySlug === 'upcoming') return 'upcoming';
    if (categorySlug === 'live') return 'live';
    if(initialLiveMatches.length > 0) return 'live';
    return 'upcoming';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  useEffect(() => {
    const newDefaultTab = getDefaultTab();
    if (activeTab !== newDefaultTab) {
        setActiveTab(newDefaultTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, initialLiveMatches, initialUpcomingMatches]);
  
  const displayTitle = useMemo(() => {
    if (leagueId) {
        const allMatches = [...initialLiveMatches, ...initialUpcomingMatches];
        const matchWithLeague = allMatches.find(m => m.league && m.league.name !== 'N/A');
        if (matchWithLeague) {
            return matchWithLeague.league.name;
        } else if (initialLeagues.length > 0) {
            const league = initialLeagues.find(l => String(l.id) === leagueId);
            if (league) return league.name;
        }
    }
    return categoryName;
  }, [leagueId, initialLiveMatches, initialUpcomingMatches, categoryName, initialLeagues]);
  
  const filteredLeagues = useMemo(() => {
    if (!searchTerm) return initialLeagues;
    return initialLeagues.filter(league =>
      league.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialLeagues, searchTerm]);

  const matchesToShow = useMemo(() => {
    let sourceMatches;
    if (categorySlug === 'live') {
        sourceMatches = initialLiveMatches;
    } else if (categorySlug === 'upcoming') {
        sourceMatches = initialUpcomingMatches;
    } else { // football page with tabs
        sourceMatches = activeTab === 'live' ? initialLiveMatches : initialUpcomingMatches;
    }

    if (!searchTerm) return sourceMatches;
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return sourceMatches.filter(match =>
      match.name.toLowerCase().includes(lowercasedSearchTerm) ||
      match.league.name.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [initialLiveMatches, initialUpcomingMatches, searchTerm, activeTab, categorySlug]);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-3 space-y-3">
                <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-1/4" />
                </div>
                 <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-8 w-1/3" />
                </div>
                <div className="flex justify-around space-x-2 pt-2">
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                </div>
            </Card>
        ))}
    </div>
  );

  const renderMatchList = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchesToShow.map((match) => <MatchCard key={match.id} match={match} />)}
      </div>
  );

  const renderNoMatches = () => {
    let message = 'No matches for this selection were found at this time.';
    if (searchTerm) {
      message = `No matches found for "${searchTerm}".`
    } else if(categorySlug === 'live' || (categorySlug === 'football' && activeTab === 'live')) {
      message = 'No live matches were found for this selection.';
    } else if(categorySlug === 'upcoming' || (categorySlug === 'football' && activeTab === 'upcoming')) {
      message = 'No upcoming matches were found for this selection.';
    }

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
        {isLoading ? (
          <Card>
            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
            <CardContent className="space-y-3 p-4">
              {[...Array(15)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        ) : initialError ? (
          <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Failed to load leagues</p>
            <p className="text-sm mt-2 max-w-md mx-auto whitespace-pre-wrap">{initialError}</p>
          </div>
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
            <p className="text-sm">{searchTerm ? `No leagues found for "${searchTerm}".` : "Could not retrieve league information at this time."}</p>
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
                  Live <Badge variant="destructive" className="ml-2 animate-pulse">{initialLiveMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                  Upcoming <Badge variant="secondary" className="ml-2">{initialUpcomingMatches.length}</Badge>
              </TabsTrigger>
            </TabsList>
        </Tabs>
      )}

      {isLoading ? renderSkeletons() : initialError ? (
         <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Failed to load matches</p>
            <p className="text-sm mt-2 max-w-md mx-auto whitespace-pre-wrap">{initialError}</p>
         </div>
      ) : matchesToShow.length > 0 ? renderMatchList() : renderNoMatches()}
    </div>
  );
}
