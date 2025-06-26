
export async function GET() {
  const apiKey = process.env.SPORTMONKS_API_KEY;

  try {
    const [footballRes, cricketRes] = await Promise.all([
      fetch(`https://api.sportmonks.com/v3/football/leagues?api_token=${apiKey}`, {
        next: { revalidate: 60 }, // optional cache control
      }),
      fetch(`https://cricket.sportmonks.com/api/v2.0/leagues?api_token=${apiKey}`, {
        cache: "no-store", // force fresh data
      }),
    ]);

    if (!footballRes.ok) {
      console.error('Failed to fetch football leagues:', footballRes.status, await footballRes.text());
    }
    if (!cricketRes.ok) {
      console.error('Failed to fetch cricket leagues:', cricketRes.status, await cricketRes.text());
    }

    const football = footballRes.ok ? await footballRes.json() : { data: [] };
    const cricket = cricketRes.ok ? await cricketRes.json() : { data: [] };

    return Response.json({
      footballLeagues: football.data || [],
      cricketLeagues: cricket.data || [],
    });
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return new Response("Failed to load leagues", { status: 500 });
  }
}
