"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Calendar } from "lucide-react";
import type { SportmonksV3Fixture } from '@/types/sportmonks';

export default function UpcomingFixtures() {
  const [matches, setMatches] = useState<SportmonksV3Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/football/upcoming-fixtures");
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch upcoming matches.');
        }
        const data = await res.json();

        if (data?.data?.length) {
          setMatches(data.data);
        } else {
          setMatches([]);
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Upcoming Matches</h2>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
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
        <CardTitle>Upcoming Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p>No upcoming matches found.</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
                const homeTeam = match.participants?.find(p => p.meta.location === 'home');
                const awayTeam = match.participants?.find(p => p.meta.location === 'away');
                return (
                    <div key={match.id} className="border rounded p-3 shadow-sm hover:bg-muted/50 transition-colors">
                    <p className="font-semibold text-foreground">
                        {homeTeam?.name || 'TBA'} vs {awayTeam?.name || 'TBA'}
                    </p>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <p>{match.league?.name || 'Unknown League'}</p>
                        <span aria-hidden="true">•</span>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(match.starting_at).toLocaleString()}</span>
                        </div>
                    </div>
                    </div>
                );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
