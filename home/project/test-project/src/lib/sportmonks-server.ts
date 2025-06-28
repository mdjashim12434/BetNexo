// This file contains the server-side logic for fetching data directly from the Sportmonks API.
// It is intended to be used by Server Components and API Routes to avoid server-to-server HTTP calls.

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_KEY;

// Helper to format date to YYYY-MM-DD
const getFormattedDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

async function fetchFromSportmonks(url: string) {
    if (!apiKey) {
        console.warn("SPORTMONKS_API_KEY is not set. Returning empty data.");
        // Return a structure that matches what the caller expects to avoid `Cannot read properties of undefined (reading 'data')`
        return { data: [], pagination: { has_more: false } };
    }

    const response = await fetch(url, {
        cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error from Sportmonks API:', response.status, errorData);
        const message = errorData.message || `Failed to fetch data from Sportmonks. Status: ${response.status}`;
        throw new Error(message);
    }
    
    return response.json();
}

async function fetchPaginatedData(baseUrl: string) {
    let allFixtures: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
        const urlWithPage = `${baseUrl}&page=${currentPage}`;
        const data = await fetchFromSportmonks(urlWithPage);
        
        if (data.data && data.data.length > 0) {
            allFixtures = allFixtures.concat(data.data);
        }

        if (data.pagination && data.pagination.has_more) {
            currentPage++;
        } else {
            hasMore = false;
        }
    }
    return { data: allFixtures };
}

export async function getLiveScoresFromServer(leagueId?: number, firstPageOnly = false) {
    const includes = "participants;scores;league.country;state;periods";
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/livescores?api_token=${apiKey}&include=${includes}&tz=UTC`;
    if (leagueId) {
        baseUrl += `&leagues=${leagueId}`;
    }

    if (firstPageOnly) {
        return fetchFromSportmonks(`${baseUrl}&page=1`);
    }
    return fetchPaginatedData(baseUrl);
}

export async function getUpcomingFixturesFromServer(leagueId?: number, firstPageOnly = false) {
    const today = getFormattedDate(new Date());
    const nextMonthDate = new Date();
    nextMonthDate.setDate(nextMonthDate.getDate() + 30);
    const nextMonth = getFormattedDate(nextMonthDate);
    
    const includes = "participants;league.country;state";
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/between/${today}/${nextMonth}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    if (leagueId) {
        baseUrl += `&leagues=${leagueId}`;
    }

    if (firstPageOnly) {
        return fetchFromSportmonks(`${baseUrl}&page=1`);
    }
    return fetchPaginatedData(baseUrl);
}

export async function getFixtureDetailsFromServer(fixtureId: number) {
    const includes = "participants;league.country;state;scores;periods;comments;venue;referee";
    const url = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    return fetchFromSportmonks(url);
}

export async function getTodaysFixturesFromServer() {
    const todayDate = getFormattedDate(new Date());
    const includes = "participants;league.country;state;scores;periods";
    const baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/date/${todayDate}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    return fetchPaginatedData(baseUrl);
}
