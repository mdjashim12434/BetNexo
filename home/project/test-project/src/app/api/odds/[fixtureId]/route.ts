
import { NextResponse } from 'next/server';

// This file is deprecated. Odds data is no longer fetched this way.
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. The main application no longer uses this odds endpoint.' 
    }, 
    { status: 410 } // HTTP 410 Gone
  );
}
