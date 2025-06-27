import { NextResponse } from 'next/server';

interface ApiLeague {
  id: number;
  name: string;
}

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

  try {
    const [footballResult, cricketResult] = await Promise.allSettled([
      fetch(`${apiBaseUrl}/api/football/leagues`, { next: { revalidate: 3600 } }),
      fetch(`${apiBaseUrl}/api/cricket/leagues`, { next: { revalidate: 3600 } })
    ]);

    const combinedLeagues: { id: number; name: string; sport: 'football' | 'cricket' }[] = [];

    if (footballResult.status === 'fulfilled' && footballResult.value.ok) {
      const footballData = await footballResult.value.json();
      (footballData.data || []).forEach((league: ApiLeague) => {
        combinedLeagues.push({ id: league.id, name: league.name, sport: 'football' });
      });
    }

    if (cricketResult.status === 'fulfilled' && cricketResult.value.ok) {
      const cricketData = await cricketResult.value.json();
      (cricketData.data || []).forEach((league: ApiLeague) => {
        combinedLeagues.push({ id: league.id, name: league.name, sport: 'cricket' });
      });
    }
    
    combinedLeagues.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(combinedLeagues);

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch leagues', details: error.message }, { status: 500 });
  }
}
