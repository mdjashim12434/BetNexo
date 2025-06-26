
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MatchCard from '@/components/sports/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Frown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { ProcessedFixture } from '@/types/sportmonks';

interface SportsCategoryClientContentProps {
  initialMatches: ProcessedFixture[];
  categorySlug: string;
  categoryName: string;
  allMatchesForFiltering: ProcessedFixture[];
  error?: string | null;
}

export default function SportsCategoryClientContent({
  initialMatches,
  categorySlug,
  categoryName,
  allMatchesForFiltering,
  error,
}: SportsCategoryClientContentProps) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [displayedMatches, setDisplayedMatches] = useState<ProcessedFixture[]>(initialMatches);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    let matchesToDisplay = initialMatches;

    if (searchTerm) {
      matchesToDisplay = matchesToDisplay.filter(match =>
        match.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setDisplayedMatches(matchesToDisplay);
  }, [searchTerm, initialMatches]);
  
  if (loadingAuth) {
    return <div className="text-center p-10">Loading session...</div>;
  }
  if (!user && !loadingAuth) {
    return <div className="text-center p-10">Redirecting to login...</div>;
  }

  // Handle categories that are not yet implemented with a generic message
  if (categorySlug !== 'football' && categorySlug !== 'upcoming' && categorySlug !== 'all-sports' && categorySlug !== 'cricket') {
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
                 <div className="text-center text-muted-foreground py-10">
                    <Frown className="mx-auto h-12 w-12 mb-4" />
                    <p className="text-lg font-semibold">Coming Soon!</p>
                    <p>Matches for {categoryName} will be available soon.</p>
                </div>
           </div>
      );
  }

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
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      
      {error && (
         <div className="text-center text-destructive py-10 my-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Failed to load matches</p>
            <p className="text-sm mt-2 max-w-md mx-auto">{error}</p>
            <p className="text-xs mt-4 text-muted-foreground">This might be due to an issue with the API provider or an invalid API key.</p>
        </div>
      )}

      {!error && displayedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : !error && (
        <p className="text-center text-muted-foreground py-10">
          No upcoming {categorySlug} matches found. Please check back later.
        </p>
      )}
    </div>
  );
}
