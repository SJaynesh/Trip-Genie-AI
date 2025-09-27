// Lightweight Amadeus client utilities for OAuth and API calls

const BASE_URL = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const CLIENT_ID = process.env.AMADEUS_API_KEY || "oxZU9aY3BCMH8aX8J6APUi2ZwAEILFrZ";
const CLIENT_SECRET = process.env.AMADEUS_API_SECRET || "ZSOpqvs13Ikq38h6";

if (!CLIENT_ID || !CLIENT_SECRET) {
  // This will surface during server-side execution if env vars are missing
  console.warn('[Amadeus] Missing CLIENT_ID/CLIENT_SECRET. Please set AMADEUS_API_KEY and AMADEUS_API_SECRET in your environment.');
}

let tokenCache: { access_token: string; expires_at: number } | null = null;

async function fetchAccessToken(): Promise<{ access_token: string; expires_in: number }> {
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Amadeus credentials are not configured.');
  }
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', CLIENT_SECRET);

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to obtain Amadeus token (${res.status}): ${text}`);
  }
  return res.json();
}

export async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expires_at > now + 60) {
    return tokenCache.access_token;
  }
  const token = await fetchAccessToken();
  tokenCache = {
    access_token: token.access_token,
    // expires_in is seconds; add current time and keep a small safety margin via getAccessToken caller check
    expires_at: now + token.expires_in,
  };
  return tokenCache.access_token;
}

export async function amadeusFetch<T = any>(path: string, init?: { method?: string; params?: Record<string, any>; body?: any; headers?: Record<string, string> }): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${BASE_URL}${path}`);
  if (init?.params) {
    Object.entries(init.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString(), {
    method: init?.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus API error ${res.status} for ${path}: ${text}`);
  }
  return res.json();
}

export async function searchCityCode(keyword: string): Promise<string | null> {
  if (!keyword || keyword.length < 2) return null;
  // If user already provided a 3-letter IATA code, accept it as-is
  const maybeCode = keyword.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(maybeCode)) return maybeCode;

  const data = await amadeusFetch<{ data: Array<{ iataCode: string; subType: string; name: string }> }>(
    '/v1/reference-data/locations',
    { params: { subType: 'CITY', keyword: keyword } }
  );
  const city = data?.data?.find((d) => d.subType === 'CITY' && d.iataCode);
  return city?.iataCode || null;
}

export async function searchHotelsByCity(params: {
  cityCode: string;
  adults: number;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  currency?: string;
  roomQuantity?: number;
  bestRateOnly?: boolean;
  sort?: 'PRICE' | 'DISTANCE' | 'RECOMMENDED';
}) {
  const { cityCode, adults, checkInDate, checkOutDate, currency = 'USD', roomQuantity = 1, bestRateOnly = true, sort = 'PRICE' } = params;
  const data = await amadeusFetch(
    '/v3/shopping/hotel-offers',
    {
      params: {
        cityCode,
        adults,
        checkInDate,
        checkOutDate,
        currency,
        roomQuantity,
        bestRateOnly: String(bestRateOnly),
        sort,
      },
    }
  );
  return data;
}

// List hotel IDs in a city (used to then fetch FULL offers by hotelIds)
export async function listHotelsByCity(cityCode: string) {
  const data = await amadeusFetch(
    '/v1/reference-data/locations/hotels/by-city',
    { params: { cityCode } }
  );
  return data;
}

// Search hotel offers using a list of hotelIds (v3) with FULL view
export async function searchHotelOffersByHotelIds(params: {
  hotelIds: string[];
  adults: number;
  checkInDate: string;
  checkOutDate: string;
  currency?: string;
  roomQuantity?: number;
  bestRateOnly?: boolean;
}) {
  const { hotelIds, adults, checkInDate, checkOutDate, currency = 'USD', roomQuantity = 1, bestRateOnly = true } = params;
  const data = await amadeusFetch(
    '/v3/shopping/hotel-offers',
    {
      params: {
        hotelIds: hotelIds.join(','),
        adults,
        checkInDate,
        checkOutDate,
        currency,
        roomQuantity,
        bestRateOnly: String(bestRateOnly),
        view: 'FULL',
      },
    }
  );
  return data;
}

export async function searchFlightOffers(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  adults: number;
  children?: number; // number of child passengers (2-11 years)
  currencyCode?: string;
  max?: number;
  nonStop?: boolean;
}) {
  const { originLocationCode, destinationLocationCode, departureDate, returnDate, adults, children = 0, currencyCode = 'USD', max = 5, nonStop = false } = params;
  const data = await amadeusFetch(
    '/v2/shopping/flight-offers',
    {
      params: {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        ...(returnDate ? { returnDate } : {}),
        adults,
        ...(children && children > 0 ? { children } : {}),
        currencyCode,
        max,
        nonStop: String(nonStop),
      },
    }
  );
  return data;
}
