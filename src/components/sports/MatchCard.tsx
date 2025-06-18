
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { FC } from 'react';
import type { SimplifiedMatchOdds } from '@/types/odds';

// The Match type for MatchCard should reflect the structure of SimplifiedMatchOdds
// to ensure all necessary data (like new markets) is available if needed for display here,
// even if not all of it is rendered on the card itself.
export interface Match extends SimplifiedMatchOdds {
  league?: string;
  imageUrl?: string;
  imageAiHint?: string;
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
            alt={`${match.homeTeam} vs ${match.awayTeam}`}
            layout="fill"
            objectFit="cover"
            data-ai-hint={match.imageAiHint || `${match.sportTitle} match`}
          />
          {isLive && (
            <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded animate-pulse">LIVE</span>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="font-headline text-lg truncate">{match.homeTeam} vs {match.awayTeam}</CardTitle>
        {match.league && <CardDescription>{match.league} - {match.sportTitle}</CardDescription>}
        {!match.league && <CardDescription>{match.sportTitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          {isUpcoming || !match.status ? <Calendar className="h-4 w-4 mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
          <span>{new Date(match.commenceTime).toLocaleString()}</span>
          {!match.imageUrl && isLive && (
            <span className="ml-auto bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded animate-pulse">LIVE</span>
          )}
        </div>
        { (match.homeWinOdds || match.awayWinOdds) && (
          <div className="flex justify-around space-x-2">
            <Button variant="outline" size="sm" className="flex-1">1: {match.homeWinOdds?.toFixed(2) || 'N/A'}</Button>
            {match.drawOdds && <Button variant="outline" size="sm" className="flex-1">X: {match.drawOdds.toFixed(2)}</Button>}
            <Button variant="outline" size="sm" className="flex-1">2: {match.awayWinOdds?.toFixed(2) || 'N/A'}</Button>
          </div>
        )}
        {/* Minimal display of other markets if needed - keeping card simple for now */}
        {/* Example: Show if BTTS odds exist */}
        {/* {match.bttsMarket && (match.bttsMarket.yesOdds || match.bttsMarket.noOdds) && (
          <p className="text-xs text-muted-foreground text-center mt-1">BTTS available</p>
        )} */}
      </CardContent>
      <CardFooter>
        <Button variant="default" className="w-full" asChild>
          <Link href={`/match/${match.id}?sportKey=${match.sportKey}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MatchCard;
