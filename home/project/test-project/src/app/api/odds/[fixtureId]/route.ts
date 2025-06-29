
import { NextResponse } from 'next/server';

// This route is deprecated. Odds data is now fetched via Sportmonks on the match detail page.
export async function GET() {
  return NextResponse.json(
    { error: 'This API endpoint is deprecated and no longer in use.' },
    { status: 410 } // HTTP 410 Gone
  );
}
