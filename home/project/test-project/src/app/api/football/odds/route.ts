// This file is deprecated and no longer used.
// Odds data is now fetched directly from Sportmonks API endpoints for fixtures
// by adding `odds` to the `include` query parameter.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Odds are now included in fixture-related API calls.' 
    }, 
    { status: 410 } // HTTP 410 Gone
  );
}
