
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { FC } from 'react';

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  time: string; // "Live", "14:00", "Tomorrow", Date string
  sport: string; // "Cricket", "Football"
  league?: string;
  oddsA?: string;
  oddsDraw?: string;
  oddsB?: string;
  imageUrl?: string;
  imageAiHint?: string; // Added for AI hint consistency
  status?: 'upcoming' | 'live' | 'finished';
}

interface MatchCardProps {
  match: Match;
}

const MatchCard: FC<MatchCardProps> = ({ match }) => {
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      {match.imageUrl && (
        <div className="relative h-40 w-full">
          <Image 
            src={match.imageUrl} 
            alt={`${match.teamA} vs ${match.teamB}`} 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint={match.imageAiHint || `${match.sport} match`} // Use imageAiHint
          />
          {isLive && (
            <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded animate-pulse">LIVE</span>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="font-headline text-lg truncate">{match.teamA} vs {match.teamB}</CardTitle>
        {match.league && <CardDescription>{match.league} - {match.sport}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          {isUpcoming || !match.status ? <Calendar className="h-4 w-4 mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
          <span>{match.time}</span>
          {!match.imageUrl && isLive && (
             <span className="ml-auto bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded animate-pulse">LIVE</span>
          )}
        </div>
        { (match.oddsA || match.oddsB) && (
          <div className="flex justify-around space-x-2">
            <Button variant="outline" size="sm" className="flex-1">1: {match.oddsA || 'N/A'}</Button>
            {match.oddsDraw && <Button variant="outline" size="sm" className="flex-1">X: {match.oddsDraw}</Button>}
            <Button variant="outline" size="sm" className="flex-1">2: {match.oddsB || 'N/A'}</Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="default" className="w-full" asChild>
          {/* Ensure the link is correctly formed for static export. 
              It will point to /match/[id].html implicitly. */}
          <Link href={`/match/${match.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MatchCard;

    