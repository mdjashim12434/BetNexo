import { NextResponse } from 'next/server';

// This route is deprecated. League data is now fetched server-side in the
// /sports/[category] page component to improve performance and reliability.
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This API endpoint is deprecated. Please update client components to receive league data via props.' 
    }, 
    { status: 410 } // HTTP 410 Gone
  );
}
