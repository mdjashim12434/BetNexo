
export async function GET() {
  const apiKey = process.env.SPORTMONKS_API_KEY;

  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return new Response(JSON.stringify({ error: "API key is not configured on the server." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

  const footballResult = await fetch(`${apiBaseUrl}/api/football/leagues`, { next: { revalidate: 3600 } });

  let footballLeagues = [];

  if (footballResult.ok) {
    const footballData = await footballResult.json();
    footballLeagues = footballData.data ?? [];
  } else {
    console.error("Fetching football leagues failed:", `Status: ${footballResult.status}`);
  }
  
  if (footballLeagues.length === 0) {
      console.warn("Football league fetch failed or returned no data.");
  }

  // The component expects a `footballLeagues` property.
  // We remove cricketLeagues by providing an empty array.
  return Response.json({
    footballLeagues,
    cricketLeagues: [] 
  });
}
