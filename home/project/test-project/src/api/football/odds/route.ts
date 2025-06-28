
// This file is deprecated. Odds are now fetched directly by the sportmonksAPI service 
// if required, but are currently disabled in list views to improve reliability.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated as odds functionality is currently disabled in this context.' 
    }, 
    { status: 410 } // HTTP 410 Gone
  );
}
