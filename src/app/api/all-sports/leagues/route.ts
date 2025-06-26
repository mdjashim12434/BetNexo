export async function GET() {
  const footballToken = process.env.SPORTMONKS_FOOTBALL_TOKEN;
  const cricketToken = process.env.SPORTMONKS_CRICKET_TOKEN;

  try {
    const [footballRes, cricketRes] = await Promise.all([
      fetch(`https://api.sportmonks.com/v3/football/leagues?api_token=${footballToken}`, { cache: 'no-store' }),
      fetch(`https://cricket.sportmonks.com/api/v2.0/leagues?api_token=${cricketToken}`, { cache: 'no-store' })
    ]);

    const football = await footballRes.json();
    const cricket = await cricketRes.json();

    return Response.json({
      footballLeagues: football.data ?? [],
      cricketLeagues: cricket.data ?? []
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response("Server error", { status: 500 });
  }
}
