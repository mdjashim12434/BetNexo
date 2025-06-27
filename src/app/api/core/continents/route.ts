import { NextResponse } from 'next/server';

const SPORTMONKS_CORE_API_URL = 'https://api.sportmonks.com/v3/core';
const apiKey = process.env.SPORTMONKS_API_KEY;

export async function GET() {
  if (!apiKey) {
    console.error("SPORTMONKS_API_KEY is not set in environment variables.");
    return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
  }

  // The user provided include is 'countries'
  const includes = "countries";
  const url = `${SPORTMONKS_CORE_API_URL}/continents?api_token=${apiKey}&include=${includes}`;

  try {
    const apiResponse = await fetch(url, {
        next: { revalidate: 86400 } // Cache for 24 hours, as continents/countries don't change often
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error from Sportmonks Core API (continents):", apiResponse.status, errorData);
        let errorMessage = `Failed to fetch continents. Status: ${apiResponse.status}`;
        if (errorData && errorData.message) {
            errorMessage += ` - Message: ${errorData.message}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error proxying request to Sportmonks Core API (continents):", error);
    return NextResponse.json({ error: 'An internal server error occurred while contacting the proxy API.' }, { status: 500 });
  }
}
