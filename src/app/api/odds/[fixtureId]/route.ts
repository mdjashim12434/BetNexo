import { NextResponse, type NextRequest } from 'next/server';
import { fetchFixtureDetails } from '@/services/sportmonksAPI';
import type { ProcessedFixture } from '@/types/sportmonks';

export async function GET(request: NextRequest, { params }: { params: { fixtureId: string } }) {
    const { fixtureId } = params;
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') as 'football' | 'cricket';

    if (!fixtureId) {
        return NextResponse.json({ error: 'Fixture ID is required.' }, { status: 400 });
    }
    if (!sport) {
        return NextResponse.json({ error: 'Sport parameter is required.' }, { status: 400 });
    }

    try {
        const fixtureDetails: ProcessedFixture = await fetchFixtureDetails(Number(fixtureId), sport);
        
        const oddsData: { marketName: string, oddValue: string }[] = [];

        if (fixtureDetails.odds.home) {
            oddsData.push({ marketName: `Win: ${fixtureDetails.homeTeam.name}`, oddValue: fixtureDetails.odds.home.toFixed(2) });
        }
        if (fixtureDetails.odds.draw) {
            oddsData.push({ marketName: 'Draw', oddValue: fixtureDetails.odds.draw.toFixed(2) });
        }
        if (fixtureDetails.odds.away) {
            oddsData.push({ marketName: `Win: ${fixtureDetails.awayTeam.name}`, oddValue: fixtureDetails.odds.away.toFixed(2) });
        }

        if (fixtureDetails.odds.overUnder?.point) {
            oddsData.push({ marketName: `Over ${fixtureDetails.odds.overUnder.point}`, oddValue: fixtureDetails.odds.overUnder.over?.toFixed(2) || 'N/A' });
            oddsData.push({ marketName: `Under ${fixtureDetails.odds.overUnder.point}`, oddValue: fixtureDetails.odds.overUnder.under?.toFixed(2) || 'N/A' });
        }
        
        if (fixtureDetails.odds.btts) {
            oddsData.push({ marketName: 'Both Teams to Score: Yes', oddValue: fixtureDetails.odds.btts.yes?.toFixed(2) || 'N/A' });
            oddsData.push({ marketName: 'Both Teams to Score: No', oddValue: fixtureDetails.odds.btts.no?.toFixed(2) || 'N/A' });
        }

        return NextResponse.json(oddsData);

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch odds', details: error.message }, { status: 500 });
    }
}
