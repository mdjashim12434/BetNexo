
"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Goal, Bell, Star, Info } from 'lucide-react';
import { format } from 'date-fns';
import type { ProcessedFixture } from "@/types/sportmonks";

const UpcomingMatchCard = ({ match }: { match: ProcessedFixture }) => {
    return (
        <Link href={`/match/${match.id}`} passHref>
        <Card as="a" className="p-3 transition-all hover:bg-muted/50 cursor-pointer">
           <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <Goal className="h-4 w-4 text-primary" />
              <span className="font-semibold truncate">{match.league?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Star className="h-4 w-4" />
            </div>
          </div>
          
           <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex flex-col items-center gap-1 w-2/5 text-center">
              <Image src={match.homeTeam.image_path || `https://placehold.co/40x40.png`} alt={match.homeTeam.name || 'Home'} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
              <span className="font-semibold text-sm truncate">{match.homeTeam.name}</span>
            </div>
            <div className="text-xl font-bold text-muted-foreground">
              VS
            </div>
            <div className="flex flex-col items-center gap-1 w-2/5 text-center">
              <Image src={match.awayTeam.image_path || `https://placehold.co/40x40.png`} alt={match.awayTeam.name || 'Away'} width={32} height={32} className="rounded-full" data-ai-hint="team logo" />
              <span className="font-semibold text-sm text-right truncate">{match.awayTeam.name}</span>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mb-3">{format(new Date(match.startingAt), "dd.MM.yy hh:mm a")}</p>
        </Card>
      </Link>
    );
};

interface UpcomingFixturesProps {
  matches: ProcessedFixture[];
  loading: boolean;
  error: string | null;
}

export default function UpcomingFixtures({ matches, loading, error }: UpcomingFixturesProps) {
  if (loading) {
     return (
        <section>
            <div className="mb-2 flex justify-between items-center">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-7 w-12" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </section>
    );
  }

  if (error) {
     return (
      <Card>
          <div className="p-4">
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="whitespace-pre-wrap">{error}</p>
            </div>
          </div>
      </Card>
    );
  }

  if (matches.length === 0) {
      return (
        <section>
            <div className="mb-2 flex justify-between items-center">
                <h2 className="font-headline text-xl font-bold text-foreground">Top pre-match <Button variant="ghost" size="sm" className="ml-1 text-primary">Sport</Button></h2>
                <Button variant="link" asChild><Link href="/sports/upcoming">All</Link></Button>
            </div>
            <div className="text-center py-10 text-muted-foreground min-h-[100px] flex flex-col items-center justify-center">
                <Info className="h-8 w-8 mb-3 text-primary/50" />
                <p className="font-semibold">No upcoming matches found.</p>
            </div>
        </section>
      );
  }

  return (
    <section>
       <div className="mb-2 flex justify-between items-center">
        <h2 className="font-headline text-xl font-bold text-foreground">Top pre-match <Button variant="ghost" size="sm" className="ml-1 text-primary">Sport</Button></h2>
        <Button variant="link" asChild><Link href="/sports/upcoming">All</Link></Button>
      </div>
      <div className="space-y-3">
        {matches.map((match) => (
          <UpcomingMatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
