
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { FC } from 'react';
import type { ProcessedFixture } from '@/types/sportmonks';
import { format } from "date-fns";

interface MatchCardProps {
  match: ProcessedFixture;
}

const MatchCard: FC<MatchCardProps> = ({ match }) => {
  const isLive = match.state?.state === 'INPLAY' || match.state?.state === 'Live';
  const isUpcoming = !isLive && match.state?.state !== 'Finished' && match.state?.state !== 'FT';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-lg truncate">{match.name}</CardTitle>
        <CardDescription>{match.league.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          {isUpcoming ? <Calendar className="h-4 w-4 mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
          <span>{format(new Date(match.startingAt), 'MMM d, h:mm a')}</span>
          {isLive && (
            <span className="ml-auto bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded animate-pulse">LIVE</span>
          )}
        </div>
        {(match.odds.home || match.odds.away) && (
          <div className="flex justify-around space-x-2">
            <Button variant="outline" size="sm" className="flex-1">1: {match.odds.home?.toFixed(2) || 'N/A'}</Button>
            {match.odds.draw && <Button variant="outline" size="sm" className="flex-1">X: {match.odds.draw.toFixed(2)}</Button>}
            <Button variant="outline" size="sm" className="flex-1">2: {match.odds.away?.toFixed(2) || 'N/A'}</Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="default" className="w-full" asChild>
          <Link href={`/match/${match.id}?sport=${match.sportKey}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MatchCard;
