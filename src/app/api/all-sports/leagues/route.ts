
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

    const football = await footballRes.json();
    const cricket = await cricketRes.json();

    return Response.json({
      footballLeagues: football.data || [],
      cricketLeagues: cricket.data || [],
    });
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return new Response("Failed to load leagues", { status: 500 });
  }
}
