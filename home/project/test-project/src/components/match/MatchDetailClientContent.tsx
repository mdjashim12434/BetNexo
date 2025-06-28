
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart2, Info, Goal, BookText, MapPin, Gavel, ShieldQuestion } from 'lucide-react';
import type { ProcessedFixture } from '@/types/sportmonks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface MatchDetailClientContentProps {
  initialMatch: ProcessedFixture;
}

export default function MatchDetailClientContent({ initialMatch }: MatchDetailClientContentProps) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();
  const [match, setMatch] = useState<ProcessedFixture>(initialMatch);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    setMatch(initialMatch);
  }, [initialMatch]);

  if (loadingAuth) {
    return <div className="text-center p-10">Loading user session...</div>;
  }
  
  const isFinished = match.isFinished;
  const isLive = match.isLive;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="self-start">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
      </Button>

      <Card className="overflow-hidden shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{match.name}</CardTitle>
          <CardDescription className="text-lg">{match.league.name} | {format(new Date(match.startingAt), "PPp")}</CardDescription>
            {(isLive || isFinished) && (
              <span className={cn("w-fit text-white px-3 py-1.5 text-sm font-bold rounded", { "bg-red-600 animate-pulse": isLive, "bg-gray-600": isFinished })}>
                {isLive ? `LIVE - ${match.minute || 0}'` : "FINISHED"}
              </span>
            )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="commentary" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="commentary">Commentary</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            <TabsContent value="commentary">
              <Card>
                <CardHeader><CardTitle className="font-headline flex items-center"><BookText className="mr-2 h-5 w-5"/>Live Commentary</CardTitle></CardHeader>
                <CardContent>
                  {match.comments && match.comments.length > 0 ? (
                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                      <div className="space-y-4">
                        {match.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                {comment.minute}'
                              </span>
                            </div>
                            <div className="pt-1">
                              <p className={cn("text-sm", { "font-bold text-primary": comment.is_goal })}>
                                {comment.is_goal && <Goal className="inline-block h-4 w-4 mr-1.5 text-green-500" />}
                                {comment.comment}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center">
                      <ShieldQuestion className="h-10 w-10 mb-3 text-primary/50" />
                      <p className="font-semibold">No live commentary available for this match.</p>
                      <p className="text-sm">Commentary usually appears when the match is live.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="info">
              <Card>
                <CardHeader><CardTitle className="font-headline flex items-center"><Info className="mr-2 h-5 w-5" />Match Information</CardTitle></CardHeader>
                <CardContent>
                   <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-muted-foreground">League</h4>
                        <p>{match.league.name}{match.league.countryName !== 'N/A' && ` - ${match.league.countryName}`}</p>
                      </div>
                      {match.venue && (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground"/>
                          <div>
                            <h4 className="font-semibold text-muted-foreground">Venue</h4>
                            <p>{match.venue.name}, {match.venue.city}</p>
                          </div>
                        </div>
                      )}
                      {match.referee && (
                        <div className="flex items-start">
                           <Gavel className="h-4 w-4 mr-2 mt-1 text-muted-foreground"/>
                           <div>
                            <h4 className="font-semibold text-muted-foreground">Referee</h4>
                            <p>{match.referee.name}</p>
                           </div>
                        </div>
                      )}
                      {!match.venue && !match.referee && (
                        <p className="text-muted-foreground">Detailed match information is not available.</p>
                      )}
                      <div className="pt-4 text-center">
                        <p className="text-muted-foreground">Betting on matches will be available soon.</p>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
             <TabsContent value="stats">
              <Card>
                <CardHeader><CardTitle className="font-headline flex items-center"><BarChart2 className="mr-2 h-5 w-5" />Match Statistics</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-10">Detailed match statistics for football will be available here soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
