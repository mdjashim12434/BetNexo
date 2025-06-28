
"use client";
import React from "react";
import Link from "next/link";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';
import type { ProcessedFixture } from "@/types/sportmonks";
import MatchCard from "@/components/sports/MatchCard";

interface LiveFixturesProps {
  matches: ProcessedFixture[];
  loading: boolean;
  error: string | null;
}

export default function LiveFixtures({ matches, loading, error }: LiveFixturesProps) {
  if (loading) {
    return (
        <section>
            <div className="mb-2 flex justify-between items-center">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-7 w-12" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
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
            <h2 className="font-headline text-xl font-bold text-foreground">Top LIVE <Button variant="ghost" size="sm" className="ml-1 text-primary">Sport</Button></h2>
             <Button variant="link" asChild><Link href="/sports/live">All</Link></Button>
          </div>
          <div className="text-center py-10 text-muted-foreground min-h-[100px] flex flex-col items-center justify-center">
            <Info className="h-8 w-8 mb-3 text-primary/50" />
            <p className="font-semibold">No live matches found right now.</p>
          </div>
        </section>
      );
  }

  return (
    <section>
      <div className="mb-2 flex justify-between items-center">
        <h2 className="font-headline text-xl font-bold text-foreground">Top LIVE <Button variant="ghost" size="sm" className="ml-1 text-primary">Sport</Button></h2>
        <Button variant="link" asChild><Link href="/sports/live">All</Link></Button>
      </div>
      <div className="space-y-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
