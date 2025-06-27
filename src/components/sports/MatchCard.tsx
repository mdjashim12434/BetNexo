
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import type { FC } from 'react';
import type { ProcessedFixture } from '@/types/sportmonks';
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  match: ProcessedFixture;
}

const MatchCard: FC<MatchCardProps> = ({ match }) => {
  const isUpcoming = !match.isLive && !match.isFinished;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="font-headline text-lg truncate">{match.name}</CardTitle>
            <CardDescription>{match.league.name}</CardDescription>
          </div>
          {match.isLive && (
            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {match.isLive ? (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-lg font-semibold">
                <span className="truncate pr-2">{match.homeTeam.name}</span>
                <span className="font-bold text-primary">{match.homeScore}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold">
                <span className="truncate pr-2">{match.awayTeam.name}</span>
                <span className="font-bold text-primary">{match.awayScore}</span>
            </div>
            {match.minute && <p className="text-xs text-center pt-1 text-yellow-500 font-bold">{match.minute}'</p>}
          </div>
        ) : (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{format(new Date(match.startingAt), 'PPp')}</span>
          </div>
        )}

        {(match.odds.home || match.odds.away) && isUpcoming && (
          <div className="flex justify-around space-x-2 pt-2">
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
