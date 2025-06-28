
import { NextResponse } from 'next/server';

// This route is deprecated as it's currently unused.
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated as it is not currently used by any component.' 
    }, 
    { status: 410 }
  );
}
