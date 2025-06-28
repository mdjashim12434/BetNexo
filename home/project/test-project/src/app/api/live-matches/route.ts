
import { NextResponse } from 'next/server';

// This route is deprecated. Data is now fetched via server components.
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Data is now fetched using server components.' 
    }, 
    { status: 410 }
  );
}
