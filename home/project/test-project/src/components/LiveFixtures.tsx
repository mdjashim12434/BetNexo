
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Goal, Bell, Star, Info } from 'lucide-react';

const LiveMatchCard = ({ match }: { match: any }) => {
    const homeTeam = match.participants?.find((p: any) => p.meta.location === 'home');
    const awayTeam = match.participants?.find((p: any) => p.meta.location === 'away');
    const homeScore = match.scores?.find((s: any) => s.participant_id === homeTeam?.id && s.description === 'CURRENT')?.score.goals || 0;
    const awayScore = match.scores?.find((s: any) => s.participant_id === awayTeam?.id && s.description === 'CURRENT')?.score.goals || 0;
    const minute = match.periods?.find((p: any) => p.ticking)?.minutes;

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
            <div className="flex items-center gap-2 w-2/5 truncate">
              <Image src={homeTeam?.image_path || `https://placehold.co/40x40.png`} alt={homeTeam?.name || ''} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
              <span className="font-semibold text-sm truncate">{homeTeam?.name || 'Home'}</span>
            </div>
            <div className="text-xl font-bold text-center">
              {homeScore} : {awayScore}
            </div>
            <div className="flex items-center gap-2 w-2/5 justify-end truncate">
              <span className="font-semibold text-sm text-right truncate">{awayTeam?.name || 'Away'}</span>
              <Image src={awayTeam?.image_path || `https://placehold.co/40x40.png`} alt={awayTeam?.name || ''} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
            </div>
          </div>
          
          {minute && <p className="text-center text-xs text-yellow-500 mb-3">{minute}' - {match.state?.name}</p>}
        </Card>
      </Link>
    );
};


export default function LiveFixtures() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState<any>(null);

  useEffect(() => {
    const fetchLive = async () => {
      setLoading(true);
      setError("");
      setRawResponse(null);
      try {
        const res = await fetch("/api/football/live-scores");
        const responseText = await res.text();
        const data = JSON.parse(responseText);
        
        setRawResponse(data);

        if (!res.ok) {
            const errorMessage = data.error || data.message || `API responded with status ${res.status}`;
            setError(errorMessage);
            setMatches([]);
            return;
        }
        
        if (data && Array.isArray(data.data)) {
          setMatches(data.data.slice(0, 10));
        } else {
          setMatches([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch live matches:", err);
        setError(err.message || "An unknown error occurred during fetch or JSON parsing.");
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
  }, []);

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
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="font-bold">Error fetching live matches:</p>
              </div>
              <p>{error}</p>
              {rawResponse && (
                <div className="mt-2 w-full">
                  <p className="font-bold text-xs mb-1">Raw API Response:</p>
                  <pre className="text-xs bg-black/20 p-2 rounded whitespace-pre-wrap max-h-60 overflow-auto">
                    {JSON.stringify(rawResponse, null, 2)}
                  </pre>
                </div>
              )}
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
          <div className="text-center py-10 text-muted-foreground min-h-[100px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4">
            <Info className="h-8 w-8 mb-3 text-primary/50" />
            <p className="font-semibold">No live matches found right now.</p>
            {rawResponse && (
                <div className="mt-4 text-left w-full text-xs">
                    <p className="text-center font-bold mb-2">API Response:</p>
                    <pre className="bg-background p-2 rounded whitespace-pre-wrap max-h-48 overflow-auto">
                        {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                </div>
            )}
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
        {matches.map((match: any) => (
          <LiveMatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
