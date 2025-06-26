
export async function GET() {
  const apiKey = process.env.SPORTMONKS_API_KEY;

  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return new Response(JSON.stringify({ error: "API key is not configured on the server." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const [footballResult, cricketResult] = await Promise.allSettled([
    fetch(`https://api.sportmonks.com/v3/football/leagues?api_token=${apiKey}`, { next: { revalidate: 3600 } }),
    fetch(`https://api.sportmonks.com/v3/cricket/leagues?api_token=${apiKey}`, { next: { revalidate: 3600 } })
  ]);

  let footballLeagues = [];
  let cricketLeagues = [];

  if (footballResult.status === 'fulfilled' && footballResult.value.ok) {
    const footballData = await footballResult.value.json();
    footballLeagues = footballData.data ?? [];
  } else if (footballResult.status === 'fulfilled') {
    // API returned non-ok status
    console.error(`Football leagues API failed with status ${footballResult.value.status}:`, await footballResult.value.text());
  } else {
    // Fetch itself failed
    console.error("Fetching football leagues failed:", footballResult.reason);
  }

  if (cricketResult.status === 'fulfilled' && cricketResult.value.ok) {
    const cricketData = await cricketResult.value.json();
    cricketLeagues = cricketData.data ?? [];
  } else if (cricketResult.status === 'fulfilled') {
    // API returned non-ok status
    console.error(`Cricket leagues API failed with status ${cricketResult.value.status}:`, await cricketResult.value.text());
  } else {
    // Fetch itself failed
    console.error("Fetching cricket leagues failed:", cricketResult.reason);
  }
  
  // If both APIs failed to return any data, we might still want to inform the client.
  // However, for maximum resilience, we return what we have. An empty list will be handled by the UI.
  if (footballLeagues.length === 0 && cricketLeagues.length === 0) {
      console.warn("Both football and cricket league fetches failed or returned no data.");
  }

  return Response.json({
    footballLeagues,
    cricketLeagues
  });
}
