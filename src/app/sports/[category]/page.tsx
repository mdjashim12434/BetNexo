
'use client';

import AppLayout from '@/components/AppLayout';
import MatchCard, { type Match } from '@/components/sports/MatchCard';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for matches - Opticodds API would provide this
const allMatches: Match[] = [
  { id: '1', teamA: 'India', teamB: 'Australia', time: '14:00 Local', sport: 'Cricket', league: 'World Cup', oddsA: '1.80', oddsB: '2.10', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=Cricket+Match' },
  { id: '2', teamA: 'England', teamB: 'South Africa', time: 'LIVE', sport: 'Cricket', league: 'Test Series', oddsA: '2.00', oddsDraw: '3.50', oddsB: '2.50', status: 'live', imageUrl: 'https://placehold.co/600x300.png?text=Live+Cricket' },
  { id: '3', teamA: 'Real Madrid', teamB: 'Barcelona', time: 'Tomorrow 19:00 GMT', sport: 'Football', league: 'La Liga', oddsA: '2.20', oddsDraw: '3.20', oddsB: '3.00', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=El+Clasico' },
  { id: '4', teamA: 'Man City', teamB: 'Liverpool', time: 'LIVE', sport: 'Football', league: 'Premier League', oddsA: '1.90', oddsDraw: '3.60', oddsB: '3.80', status: 'live', imageUrl: 'https://placehold.co/600x300.png?text=EPL+Live' },
  { id: '5', teamA: 'Warriors', teamB: 'Lakers', time: 'Today 20:00 PST', sport: 'Basketball', league: 'NBA', oddsA: '1.75', oddsB: '2.15', status: 'upcoming' },
  { id: '6', teamA: 'Chennai Super Kings', teamB: 'Mumbai Indians', time: '20 Apr 2024, 18:30', sport: 'Cricket', league: 'IPL', oddsA: '1.95', oddsB: '1.85', status: 'upcoming', imageUrl: 'https://placehold.co/600x300.png?text=IPL+Match' },
  { id: '7', teamA: 'PSG', teamB: 'Bayern Munich', time: 'LIVE', sport: 'Football', league: 'Champions League', oddsA: '2.50', oddsDraw: '3.40', oddsB: '2.70', status: 'live' },
];

const categoryMapping: { [key: string]: string } = {
  live: 'Live',
  casino: 'Casino', // Casino would likely have a different display, this is a placeholder
  cricket: 'Cricket',
  football: 'Football',
  upcoming: 'Upcoming',
  'all-sports': 'All Sports',
};

export default function SportCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loadingAuth } = useAuth();
  const categorySlug = typeof params.category === 'string' ? params.category : 'all-sports';
  const categoryName = categoryMapping[categorySlug] || 'Sports';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('all'); // 'all', 'cricket', 'football', etc.
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    let matches = allMatches;
    if (categorySlug === 'live') {
      matches = allMatches.filter(match => match.status === 'live');
    } else if (categorySlug === 'upcoming') {
      matches = allMatches.filter(match => match.status === 'upcoming');
    } else if (categorySlug !== 'all-sports') {
      matches = allMatches.filter(match => match.sport.toLowerCase() === categorySlug.replace('-', ' '));
    }

    if (filterSport !== 'all') {
        matches = matches.filter(match => match.sport.toLowerCase() === filterSport);
    }

    if (searchTerm) {
      matches = matches.filter(match =>
        match.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.teamB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (match.league && match.league.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredMatches(matches);
  }, [categorySlug, searchTerm, filterSport]);

  const availableSports = ['all', ...new Set(allMatches.map(m => m.sport.toLowerCase()))];

  if (loadingAuth || !user) {
    return <AppLayout><div className="text-center p-10">Loading or redirecting...</div></AppLayout>;
  }

  return (
    <AppLayout>
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
                  {availableSports.map(sport => (
                    <SelectItem key={sport} value={sport}>
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}
        </div>

        {filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">
            No matches found for this category or your filters.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
