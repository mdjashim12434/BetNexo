
// This file is deprecated as the homepage now fetches data directly from Sportmonks via server components.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. The main application no longer uses The Odds API for scores.' 
    }, 
    { status: 410 } // HTTP 410 Gone
  );
}
