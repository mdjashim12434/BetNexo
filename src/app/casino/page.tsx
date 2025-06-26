
'use client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Gem, Spade, Club, Heart, Diamond } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const casinoGames = [
  { id: 'slots', name: 'Slot Machines', description: 'Spin the reels for exciting wins!', icon: Gem, imageHint: "slot machine casino" },
  { id: 'roulette', name: 'Roulette', description: 'Place your bets and watch the wheel spin.', icon: Dice5, imageHint: "roulette wheel casino" },
  { id: 'blackjack', name: 'Blackjack', description: 'Beat the dealer to 21.', icon: Spade, imageHint: "blackjack cards" },
  { id: 'poker', name: 'Poker', description: 'Test your skills in various poker games.', icon: Club, imageHint: "poker table" },
  { id: 'baccarat', name: 'Baccarat', description: 'A classic card game of chance.', icon: Heart, imageHint: "baccarat game" },
  { id: 'live-dealer', name: 'Live Dealer', description: 'Real dealers, real-time action.', icon: Diamond, imageHint: "casino dealer" },
];

export default function CasinoPage() {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading session...</div></div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login...</div></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="text-center">
            <h1 className="font-headline text-4xl font-bold text-primary">Casino Royale</h1>
            <p className="text-xl text-muted-foreground mt-2">Experience the Thrill of Our Top Casino Games!</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {casinoGames.map(game => (
            <Card key={game.id} className="flex flex-col overflow-hidden hover:shadow-primary/30 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                  <Image 
                    src={`https://placehold.co/600x400.png?text=${game.name.replace(' ', '+')}`} 
                    alt={game.name} 
                    fill
                    className="object-cover" 
                    data-ai-hint={game.imageHint}
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                   <game.icon className="absolute top-4 right-4 h-8 w-8 text-white/80" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-6 flex flex-col justify-between">
                <div>
                  <CardTitle className="font-headline text-xl mb-2">{game.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                </div>
                <Button className="w-full mt-auto bg-accent text-accent-foreground hover:bg-accent/90">Play {game.name}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
