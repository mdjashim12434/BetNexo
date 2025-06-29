
import { NextResponse, type NextRequest } from 'next/server';

// This route is deprecated as its functionality has been moved to a server component
// in /app/match/[id]/page.tsx to improve performance and simplify the architecture.
export async function GET(request: NextRequest) {
    return NextResponse.json(
      { 
        error: 'This endpoint is deprecated. Match details are now fetched server-side.' 
      }, 
      { status: 410 } // HTTP 410 Gone
    );
}
