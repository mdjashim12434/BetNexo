import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, Goal } from "lucide-react";
import type { FC } from 'react';
import type { ProcessedFixture } from '@/types/sportmonks';
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { SportIcon } from '@/components/icons/SportIcon';

interface MatchCardProps {
  match: ProcessedFixture;
}

const MatchCard: FC<MatchCardProps> = ({ match }) => {
  return (
    <Link href={`/match/${match.id}`} className="block">
      <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
               <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <SportIcon sportKey={match.sportKey} className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold truncate">{match.league.name}</span>
              </div>
              <CardTitle className="font-headline text-base leading-tight truncate">{match.name}</CardTitle>
            </div>
            {match.isLive && (
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4 space-y-3">
          {match.isLive ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 items-center text-center">
                <div className="flex flex-col items-center gap-1">
                  <Image src={match.homeTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.homeTeam.name} width={40} height={40} className="mb-1" data-ai-hint="team logo"/>
                  <span className="text-sm font-semibold truncate w-full">{match.homeTeam.name}</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  <span>{match.homeScore}</span>
                  <span className="mx-2">:</span>
                  <span>{match.awayScore}</span>
                </div>
                 <div className="flex flex-col items-center gap-1">
                  <Image src={match.awayTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.awayTeam.name} width={40} height={40} className="mb-1" data-ai-hint="team logo"/>
                  <span className="text-sm font-semibold truncate w-full">{match.awayTeam.name}</span>
                </div>
              </div>
              <div className="text-xs text-center text-yellow-500 font-bold">
                 {match.state?.name}{match.minute ? `, ${match.minute}'` : ''}
              </div>
              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium text-center text-muted-foreground">Team Wins</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="w-full h-auto py-1 flex justify-between bg-card hover:bg-accent">
                    <span>W1</span>
                    <span className="font-bold">{match.odds.home?.toFixed(2) || '-'}</span>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full h-auto py-1 flex justify-between bg-card hover:bg-accent">
                    <span>W2</span>
                    <span className="font-bold">{match.odds.away?.toFixed(2) || '-'}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : ( // Upcoming match
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <div className="flex-1 flex items-center gap-2">
                  <Image src={match.homeTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.homeTeam.name} width={32} height={32} data-ai-hint="team logo"/>
                  <span className="font-semibold text-sm truncate">{match.homeTeam.name}</span>
                </div>
                <div className="font-bold text-muted-foreground px-2">VS</div>
                 <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="font-semibold text-sm truncate text-right">{match.awayTeam.name}</span>
                  <Image src={match.awayTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.awayTeam.name} width={32} height={32} data-ai-hint="team logo"/>
                </div>
              </div>
              <div className="text-xs text-center text-muted-foreground">
                {format(new Date(match.startingAt), "dd.MM.yy hh:mm a")}
              </div>
              <div className="space-y-1 pt-1">
                <p className="text-sm font-medium text-center text-muted-foreground">1X2</p>
                <div className="grid grid-cols-3 gap-2">
                   <Button variant="outline" size="sm" className="w-full h-auto py-1 flex justify-between bg-card hover:bg-accent">
                    <span>W1</span>
                    <span className="font-bold">{match.odds.home?.toFixed(2) || '-'}</span>
                  </Button>
                   <Button variant="outline" size="sm" className="w-full h-auto py-1 flex justify-between bg-card hover:bg-accent">
                    <span>X</span>
                    <span className="font-bold">{match.odds.draw?.toFixed(2) || '-'}</span>
                  </Button>
                   <Button variant="outline" size="sm" className="w-full h-auto py-1 flex justify-between bg-card hover:bg-accent">
                    <span>W2</span>
                    <span className="font-bold">{match.odds.away?.toFixed(2) || '-'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-2 mt-auto">
            <Button variant="default" className="w-full" asChild>
            <Link href={`/match/${match.id}`}>
                View Details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default MatchCard;
