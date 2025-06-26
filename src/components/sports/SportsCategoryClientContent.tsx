
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MatchCard from '@/components/sports/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Frown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { ProcessedFixture } from '@/types/sportmonks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

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
  const { user, loadingAuth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Determine if tabs should be shown for filtering
  const showTabs = categorySlug === 'football' || categorySlug === 'cricket' || categorySlug === 'all-sports';
  const [activeTab, setActiveTab] = useState('all');

  const liveCount = useMemo(() => initialMatches.filter(m => m.state?.state === 'INPLAY' || m.state?.state === 'Live').length, [initialMatches]);
  const upcomingCount = useMemo(() => initialMatches.filter(m => m.state?.state !== 'INPLAY' && m.state?.state !== 'Live' && m.state?.state !== 'Finished' && m.state?.state !== 'FT').length, [initialMatches]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/')} className="self-start sm:self-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Home
        </Button>
        <h1 className="font-headline text-3xl font-bold text-center sm:text-left flex-grow">
          {categoryName}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by Team or League..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      
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
          <p>No {activeTab !== 'all' ? activeTab : ''} matches for this selection were found at the moment. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
