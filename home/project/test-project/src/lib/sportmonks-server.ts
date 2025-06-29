
// This file contains the server-side logic for fetching data directly from the Sportmonks API.
// It is intended to be used by Server Components and API Routes to avoid server-to-server HTTP calls.

const SPORTMONKS_FOOTBALL_API_URL = 'https://api.sportmonks.com/v3/football';
const apiKey = process.env.SPORTMONKS_API_TOKEN;

// Helper to format date to YYYY-MM-DD
const getFormattedDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

async function fetchFromSportmonks(url: string) {
    console.log(`[Sportmonks Fetch] API Token available: ${!!apiKey}`);
    if (!apiKey) {
        console.warn("SPORTMONKS_API_TOKEN is not set in environment variables. Returning empty data.");
        return { data: [], pagination: { has_more: false } };
    }

    console.log(`[Sportmonks Fetch] Fetching URL: ${url.replace(apiKey, 'REDACTED_API_TOKEN')}`);
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
    let allData: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
        const urlWithPage = `${baseUrl}&page=${currentPage}`;
        const data = await fetchFromSportmonks(urlWithPage);
        
        if (data.data && data.data.length > 0) {
            allData = allData.concat(data.data);
        }

        if (data.pagination && data.pagination.has_more) {
            currentPage++;
        } else {
            hasMore = false;
        }
    }
    return { data: allData };
}

export async function getLiveScoresFromServer(leagueId?: number, firstPageOnly = false) {
    // A more focused include string to avoid plan limitations.
    const includes = "participants;league;state;scores;periods;events;comments";
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/livescores/inplay?api_token=${apiKey}&include=${includes}&tz=UTC`;
    if (leagueId) {
        baseUrl += `&leagues=${leagueId}`;
    }

    if (firstPageOnly) {
        const pageData = await fetchFromSportmonks(`${baseUrl}&page=1`);
        return pageData.data || [];
    }

    const paginatedData = await fetchPaginatedData(baseUrl);
    return paginatedData.data || [];
}

export async function getUpcomingFixturesFromServer(leagueId?: number, firstPageOnly = false) {
    const startDate = getFormattedDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
    const endDate = getFormattedDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
    
    const includes = "participants;league.country;state;odds";
    let baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/between/${startDate}/${endDate}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    if (leagueId) {
        baseUrl += `&leagues=${leagueId}`;
    }

    if (firstPageOnly) {
       const pageData = await fetchFromSportmonks(`${baseUrl}&page=1`);
       return pageData.data || [];
    }

    const paginatedData = await fetchPaginatedData(baseUrl);
    return paginatedData.data || [];
}

export async function getFixtureDetailsFromServer(fixtureId: number) {
    const includes = "participants;league.country;state;scores;periods;comments;venue;referee;odds;inplayOdds;statistics;trends";
    const url = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/${fixtureId}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    const result = await fetchFromSportmonks(url);
    return result.data;
}

export async function getTodaysFixturesFromServer() {
    const todayDate = getFormattedDate(new Date());
    const includes = "participants;league.country;state;scores;periods";
    const baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/fixtures/date/${todayDate}?api_token=${apiKey}&include=${includes}&tz=UTC`;
    const paginatedData = await fetchPaginatedData(baseUrl);
    return paginatedData.data || [];
}

export async function getFootballLeaguesFromServer() {
    const baseUrl = `${SPORTMONKS_FOOTBALL_API_URL}/leagues?api_token=${apiKey}`;
    const paginatedData = await fetchPaginatedData(baseUrl);
    return paginatedData.data || [];
}
