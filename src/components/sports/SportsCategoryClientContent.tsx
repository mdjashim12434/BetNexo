
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Keep if Back button needs it
import MatchCard, { type Match } from '@/components/sports/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface SportsCategoryClientContentProps {
  initialMatches: Match[];
  categorySlug: string;
  categoryName: string;
  availableSports: string[];
  allMatchesForFiltering: Match[]; // Used if client-side filtering is complex for 'all-sports'
}

export default function SportsCategoryClientContent({
  initialMatches,
  categorySlug,
  categoryName,
  availableSports,
  allMatchesForFiltering,
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState(categorySlug === 'all-sports' ? 'all' : categorySlug);
  const [displayedMatches, setDisplayedMatches] = useState<Match[]>(initialMatches);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    // This effect will re-filter matches when searchTerm or filterSport (for all-sports page) changes.
    // For specific category pages (cricket, football, etc.), initialMatches is already filtered.
    // The main filtering logic now resides server-side for initial load.
    // Client-side filtering is primarily for the search term and sub-filtering on 'all-sports'.

    let matchesToDisplay = initialMatches;

    if (categorySlug === 'all-sports') {
        if (filterSport !== 'all') {
            matchesToDisplay = allMatchesForFiltering.filter(match => match.sport.toLowerCase() === filterSport);
        } else {
            matchesToDisplay = allMatchesForFiltering; // Start with all if 'all' filter selected
        }
    }
    // else, initialMatches is already correctly scoped by the server component.

    if (searchTerm) {
      matchesToDisplay = matchesToDisplay.filter(match =>
        match.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.teamB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (match.league && match.league.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setDisplayedMatches(matchesToDisplay);
  }, [searchTerm, filterSport, initialMatches, categorySlug, allMatchesForFiltering]);
  
  // Reset filterSport when categorySlug changes, important if navigating between sports pages
  useEffect(() => {
    if (categorySlug === 'all-sports') {
        setFilterSport('all');
    } else if (validSportsForFilter.includes(categorySlug)) {
        setFilterSport(categorySlug);
    } else {
        setFilterSport('all'); // Default fallback
    }
  }, [categorySlug]);


  if (loadingAuth) {
    // Return a minimal loading state or null to avoid layout shifts during auth check
    return <div className="text-center p-10">Loading session...</div>;
  }
  if (!user && !loadingAuth) {
    // This should be brief as the useEffect above triggers redirect
    return <div className="text-center p-10">Redirecting to login...</div>;
  }
  
  const validSportsForFilter = ['all', ...new Set(allMatchesForFiltering.map(m => m.sport.toLowerCase()))];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="self-start sm:self-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
            placeholder="Search teams or leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {categorySlug === 'all-sports' && (
           <Select value={filterSport} onValueChange={setFilterSport}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                {validSportsForFilter.map(sport => (
                  <SelectItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        )}
      </div>

      {displayedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          No matches found for this category or your filters.
        </p>
      )}
    </div>
  );
}
