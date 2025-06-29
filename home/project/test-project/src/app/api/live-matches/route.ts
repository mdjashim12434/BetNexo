
import { NextResponse } from 'next/server';

// This route is deprecated. Data is now fetched using server components.
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This API endpoint is deprecated and no longer in use.' 
    }, 
    { status: 410 }
  );
}
