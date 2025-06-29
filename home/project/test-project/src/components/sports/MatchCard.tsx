
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bell, Star, Link as LinkIcon } from "lucide-react";
import type { FC } from 'react';
import type { ProcessedFixture } from '@/types/sportmonks';
import { format } from "date-fns";
import Image from "next/image";
import { SportIcon } from '@/components/icons/SportIcon';

interface MatchCardProps {
  match: ProcessedFixture;
}

const MatchCard: FC<MatchCardProps> = ({ match }) => {
  if (match.isLive) {
    // Live Match Card
    return (
      <Link href={`/match/${match.id}`} className="block">
        <Card className="hover:shadow-primary/20 transition-shadow duration-300">
          <CardContent className="p-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-2">
                <SportIcon sportKey={match.sportKey} className="h-5 w-5" />
                <span className="font-semibold truncate">{match.league.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <Bell className="h-4 w-4" />
                <Star className="h-4 w-4" />
              </div>
            </div>
            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 text-center">
              <div className="flex flex-col items-center text-center">
                <Image src={match.homeTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.homeTeam.name} width={40} height={40} className="mb-1" data-ai-hint="team logo" />
                <span className="font-semibold text-sm">{match.homeTeam.name}</span>
              </div>
              <div className="font-bold text-2xl text-foreground">
                <span>{match.homeScore}</span>
                <span className="mx-2">:</span>
                <span>{match.awayScore}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Image src={match.awayTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.awayTeam.name} width={40} height={40} className="mb-1" data-ai-hint="team logo" />
                <span className="font-semibold text-sm">{match.awayTeam.name}</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
              {match.state?.name}{match.minute ? `, time elapsed: ${String(match.minute).padStart(2, '0')}:00` : ''}
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-center text-muted-foreground mb-2">Team Wins</p>
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
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Upcoming Match Card
  return (
    <Link href={`/match/${match.id}`} className="block">
      <Card className="hover:shadow-primary/20 transition-shadow duration-300">
        <CardContent className="p-3">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-2">
              <SportIcon sportKey={match.sportKey} className="h-5 w-5" />
              <span className="font-semibold truncate">{match.league.name}</span>
            </div>
            <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Star className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-center my-3">
            <div className="flex-1 flex flex-col items-center gap-1">
              <Image src={match.homeTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.homeTeam.name} width={40} height={40} className="mb-1" data-ai-hint="team logo" />
              <span className="font-semibold text-sm">{match.homeTeam.name}</span>
            </div>
            <div className="font-bold text-xl text-muted-foreground">VS</div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <Image src={match.awayTeam.image_path || 'https://placehold.co/80x80.png'} alt={match.awayTeam.name} width={40} height={40} className="mb-1" data-ai-hint="team logo" />
              <span className="font-semibold text-sm">{match.awayTeam.name}</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {format(new Date(match.startingAt), "dd.MM.yy hh:mm a")}
          </p>
          <div className="mt-4">
            <p className="text-sm font-medium text-center text-muted-foreground mb-2">1X2</p>
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
        </CardContent>
      </Card>
    </Link>
  );
};

export default MatchCard;
