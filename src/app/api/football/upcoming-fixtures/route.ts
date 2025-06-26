
import { NextResponse, type NextRequest } from 'next/server';

const SPORTMONKS_ODDS_BASE_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// This route handles fetching upcoming fixtures
export async function GET(request: NextRequest) {
    if (!apiKey) {
        return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
    }

    // Includes for upcoming fixtures. We get participants, league, state, and basic odds.
    // Kept simple to ensure compatibility with standard plans.
    const includes = "participants;league.country;state;odds";
    // Filter for a popular bookmaker (id: 2 for Bet365) to get odds data
    const filters = "bookmakers:2"; 

    const url = `${SPORTMONKS_ODDS_BASE_URL}/fixtures/upcoming?api_token=${apiKey}&include=${includes}&filters=${filters}`;
    
    try {
        const response = await fetch(url, {
            next: { revalidate: 60 * 5 } // Cache for 5 minutes
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching from Sportmonks proxy for upcoming football fixtures:', errorData.message);
            // Forward a user-friendly error from our handler
            const { userFriendlyMessage } = await handleApiResponse(new Response(JSON.stringify(errorData), { status: response.status }));
            return NextResponse.json({ error: userFriendlyMessage || `Failed to fetch from Sportmonks: ${errorData.message}` }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in football upcoming fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}

// Helper to generate user-friendly error messages based on HTTP status
// Duplicated here to make the route self-contained.
const handleApiResponse = async (response: Response) => {
    if (response.ok) {
        return { json: await response.json(), userFriendlyMessage: null };
    }

    const errorJson = await response.json().catch(() => ({}));
    const apiMessage = errorJson.message || 'The API did not provide a specific error message.';

    let userFriendlyMessage: string;
    switch (response.status) {
        case 400: userFriendlyMessage = `Bad Request: The server could not understand the request. Details: ${apiMessage}`; break;
        case 401: userFriendlyMessage = `Authentication Failed: The API key is likely invalid or missing.`; break;
        case 403: userFriendlyMessage = `Forbidden: Your current API plan does not allow access to this data.`; break;
        case 429: userFriendlyMessage = `Too Many Requests: The hourly API limit has been reached.`; break;
        case 500: userFriendlyMessage = `Internal Server Error: The API provider encountered an error.`; break;
        default: userFriendlyMessage = `An unexpected API error occurred. Status: ${response.status}, Message: ${apiMessage}`; break;
    }
    console.error(`API Error (Status ${response.status}): ${apiMessage}`);
    return { json: errorJson, userFriendlyMessage };
};
