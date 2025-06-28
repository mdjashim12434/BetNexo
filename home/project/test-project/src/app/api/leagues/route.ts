
import { NextResponse } from 'next/server';

interface ApiLeague {
  id: number;
  name: string;
}

export async function GET() {
  // This endpoint is now a simple proxy, which is not ideal.
  // The 'all-sports' page should ideally use a server-side fetching pattern like the homepage.
  // For now, this maintains client-side compatibility for that specific page.
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:9002';

  try {
    // This is an internal call to another API route.
    // In a production app, it would be better for the client to call this directly
    // or for the parent page to fetch this data server-side.
    const footballResult = await fetch(`${apiBaseUrl}/api/football/leagues`, { next: { revalidate: 3600 } });

    if (!footballResult.ok) {
        return NextResponse.json({ error: 'Failed to fetch football leagues from internal API' }, { status: footballResult.status });
    }
    
    const footballData = await footballResult.json();
    const footballLeagues: { id: number; name: string; sport: 'football' }[] = (footballData.data || []).map((l: ApiLeague) => ({
        id: l.id,
        name: l.name,
        sport: 'football'
    }));
    
    // In the future, other sports could be added here.
    const combinedLeagues = [...footballLeagues];
    
    combinedLeagues.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ leagues: combinedLeagues });

  } catch (error: any) {
    console.error("Error in /api/leagues proxy:", error)
    return NextResponse.json({ error: 'Failed to fetch leagues', details: error.message }, { status: 500 });
  }
}
