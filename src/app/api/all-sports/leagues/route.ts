
export async function GET() {
  const footballToken = process.env.SPORTMONKS_FOOTBALL_TOKEN;
  const cricketToken = process.env.SPORTMONKS_CRICKET_TOKEN;

  try {
    const [footballRes, cricketRes] = await Promise.all([
      fetch(`https://api.sportmonks.com/v3/football/leagues?api_token=${footballToken}`, { cache: 'no-store' }),
      fetch(`https://cricket.sportmonks.com/api/v2.0/leagues?api_token=${cricketToken}`, { cache: 'no-store' })
    ]);

    if (!footballRes.ok) {
        const errorText = await footballRes.text();
        console.error("Football API Error:", errorText);
        throw new Error(`Football API request failed with status ${footballRes.status}`);
    }
    if (!cricketRes.ok) {
        const errorText = await cricketRes.text();
        console.error("Cricket API Error:", errorText);
        throw new Error(`Cricket API request failed with status ${cricketRes.status}`);
    }

    const football = await footballRes.json();
    const cricket = await cricketRes.json();

    return Response.json({
      footballLeagues: football.data ?? [],
      cricketLeagues: cricket.data ?? []
    });
  } catch (error) {
    console.error("API error in /api/all-sports/leagues:", error);
    return new Response("Server error while fetching leagues", { status: 500 });
  }
}
