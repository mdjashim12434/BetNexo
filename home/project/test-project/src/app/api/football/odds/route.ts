
// This file is deprecated as The Odds API is no longer used.
// The app now relies on Sportmonks for all data.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. The main application no longer uses The Odds API for odds.' 
    }, 
    { status: 410 } // HTTP 410 Gone
  );
}
