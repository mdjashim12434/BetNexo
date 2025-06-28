
import { NextResponse, type NextRequest } from 'next/server';
import { getTodaysFixturesFromServer } from '@/lib/sportmonks-server';

// This route handles fetching all fixtures for today
export async function GET(request: NextRequest) {
    try {
        const data = await getTodaysFixturesFromServer();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in today\'s football fixtures proxy route:', error);
        return NextResponse.json({ error: 'An internal server error occurred: ' + error.message }, { status: 500 });
    }
}
