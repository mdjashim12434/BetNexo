
import { NextResponse } from 'next/server';

// This route is deprecated.
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Cricket data is no longer actively used.' 
    }, 
    { status: 410 }
  );
}
