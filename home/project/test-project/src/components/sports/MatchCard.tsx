
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar } from "lucide-react";
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
      <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col h-full">
        <CardHeader className="p-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
               <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <SportIcon sportKey={match.sportKey} className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold truncate">{match.league.name}</span>
              </div>
              <CardTitle className="font-headline text-sm leading-tight truncate">{match.name}</CardTitle>
            </div>
            {match.isLive && (
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            )}
             {match.isFinished && (
              <Badge variant="secondary">Finished</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-3 flex flex-col justify-center">
          {match.isLive ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-lg font-semibold">
                  <div className="flex items-center gap-2 truncate w-2/5">
                      <Image src={match.homeTeam.image_path || `https://placehold.co/40x40.png`} alt={match.homeTeam.name} width={20} height={20} className="rounded-full" data-ai-hint="team logo" />
                      <span className="truncate">{match.homeTeam.name}</span>
                  </div>
                  <span className="font-bold text-primary">{match.homeScore} : {match.awayScore}</span>
                  <div className="flex items-center gap-2 justify-end truncate w-2/5">
                      <span className="truncate">{match.awayTeam.name}</span>
                      <Image src={match.awayTeam.image_path || `https://placehold.co/40x40.png`} alt={match.awayTeam.name} width={20} height={20} className="rounded-full" data-ai-hint="team logo" />
                  </div>
              </div>
              {match.minute && <p className="text-center text-xs text-yellow-500 font-bold">{match.state?.name}{match.minute ? `, ${String(match.minute).padStart(2, '0')}` : ''}</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex justify-between w-full items-center">
                <div className="flex-1 flex flex-col items-center gap-1">
                   <Image src={match.homeTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.homeTeam.name} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
                   <span className="text-sm font-semibold">{match.homeTeam.name}</span>
                </div>
                <div className="font-bold text-muted-foreground">VS</div>
                <div className="flex-1 flex flex-col items-center gap-1">
                   <Image src={match.awayTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.awayTeam.name} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
                   <span className="text-sm font-semibold">{match.awayTeam.name}</span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-3">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  <span>{format(new Date(match.startingAt), "dd.MM.yy hh:mm a")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default MatchCard;
