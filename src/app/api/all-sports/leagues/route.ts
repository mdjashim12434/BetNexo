
export async function GET() {
  const apiKey = process.env.SPORTMONKS_API_KEY;

  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return new Response(JSON.stringify({ error: "API key is not configured on the server." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Uses separate, version-specific API routes
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

  const [footballResult, cricketResult] = await Promise.allSettled([
    fetch(`${apiBaseUrl}/api/football/leagues`, { next: { revalidate: 3600 } }),
    fetch(`${apiBaseUrl}/api/cricket/leagues`, { next: { revalidate: 3600 } })
  ]);

  let footballLeagues = [];
  let cricketLeagues = [];

  if (footballResult.status === 'fulfilled' && footballResult.value.ok) {
    const footballData = await footballResult.value.json();
    footballLeagues = footballData.data ?? [];
  } else {
    const reason = footballResult.status === 'rejected' ? footballResult.reason : `Status: ${footballResult.value.status}`;
    console.error("Fetching football leagues failed:", reason);
  }

  if (cricketResult.status === 'fulfilled' && cricketResult.value.ok) {
    const cricketData = await cricketResult.value.json();
    cricketLeagues = cricketData.data ?? [];
  } else {
     const reason = cricketResult.status === 'rejected' ? cricketResult.reason : `Status: ${cricketResult.value.status}`;
    console.error("Fetching cricket leagues failed:", reason);
  }
  
  if (footballLeagues.length === 0 && cricketLeagues.length === 0) {
      console.warn("Both football and cricket league fetches failed or returned no data.");
  }

  return Response.json({
    footballLeagues,
    cricketLeagues
  });
}
