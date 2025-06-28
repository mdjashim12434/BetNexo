"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Radio } from "lucide-react";
import type { SportmonksV3Fixture } from '@/types/sportmonks';

export default function LiveFixtures() {
  const [matches, setMatches] = useState<SportmonksV3Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLive = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/football/live-scores");
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch live matches.');
        }
        const data = await res.json();

        if (data?.data?.length) {
          const liveStates = ['LIVE', 'HT', 'ET', 'PEN_LIVE', 'BREAK', 'INT'];
          const liveOnly = data.data.filter((match: SportmonksV3Fixture) => match.state && liveStates.includes(match.state.state));
          setMatches(liveOnly);
        } else {
          setMatches([]);
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
  }, []);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Skeleton className="h-6 w-48" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
    );
  }
  
  if (error) {
    return (
        <div className="text-destructive bg-destructive/10 p-4 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-red-500 animate-pulse"/> Live Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No live matches at the moment.</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
                const homeTeam = match.participants?.find(p => p.meta.location === 'home');
                const awayTeam = match.participants?.find(p => p.meta.location === 'away');
                const homeScore = match.scores?.find(s => s.participant_id === homeTeam?.id && s.description === 'CURRENT')?.score.goals ?? 0;
                const awayScore = match.scores?.find(s => s.participant_id === awayTeam?.id && s.description === 'CURRENT')?.score.goals ?? 0;
                const minute = match.periods?.find(p => p.ticking)?.minutes;
                
                return (
                    <div key={match.id} className="border rounded-lg p-4 shadow-sm hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{match.league?.name || 'Unknown League'}</p>
                            {minute && <p className="text-sm font-bold text-yellow-500">{minute}'</p>}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="font-semibold text-foreground truncate w-2/5 text-left">{homeTeam?.name || 'TBA'}</p>
                            <p className="text-2xl font-bold text-red-600">
                                {homeScore} - {awayScore}
                            </p>
                            <p className="font-semibold text-foreground truncate w-2/5 text-right">{awayTeam?.name || 'TBA'}</p>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-1">{match.state?.name || 'Live'}</p>
                    </div>
                );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
