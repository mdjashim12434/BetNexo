
// This file is deprecated and no longer used, as odds functionality has been removed for now.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated as odds functionality is currently disabled.' 
    }, 
    { status: 410 } // HTTP 410 Gone
  );
}
