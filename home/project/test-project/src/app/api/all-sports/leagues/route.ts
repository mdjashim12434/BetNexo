
import { NextResponse } from 'next/server';

// This route is deprecated. League data is now fetched server-side.
export async function GET() {
  return NextResponse.json(
    { error: 'This API endpoint is deprecated and no longer in use.' },
    { status: 410 } // HTTP 410 Gone
  );
}
