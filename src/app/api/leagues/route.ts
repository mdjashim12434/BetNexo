import { NextResponse } from 'next/server';

interface ApiLeague {
  id: number;
  name: string;
}

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

  try {
    const footballResult = await fetch(`${apiBaseUrl}/api/football/leagues`, { next: { revalidate: 3600 } });

    const combinedLeagues: { id: number; name: string }[] = [];

    if (footballResult.ok) {
      const footballData = await footballResult.json();
      (footballData.data || []).forEach((league: ApiLeague) => {
        combinedLeagues.push({ id: league.id, name: league.name });
      });
    }
    
    combinedLeagues.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(combinedLeagues);

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch leagues', details: error.message }, { status: 500 });
  }
}
