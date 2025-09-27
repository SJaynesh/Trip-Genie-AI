import { NextResponse } from 'next/server';
import { searchCityCode, searchFlightOffers } from '@/lib/amadeus';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const originInput = url.searchParams.get('origin') || url.searchParams.get('originLocationCode');
    const destinationInput = url.searchParams.get('destination') || url.searchParams.get('destinationLocationCode');
    const departureDate = url.searchParams.get('departureDate');
    const returnDate = url.searchParams.get('returnDate') || undefined;
    const adults = Number(url.searchParams.get('adults') || '1');
    const children = Number(url.searchParams.get('children') || '0');
    const currencyCode = url.searchParams.get('currencyCode') || 'USD';
    const max = Number(url.searchParams.get('max') || '5');
    const nonStop = url.searchParams.get('nonStop') === 'true';

    if (!originInput || !destinationInput || !departureDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required params: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    const ensureCode = async (val: string) => (/^[A-Z]{3}$/.test(val.trim().toUpperCase()) ? val.trim().toUpperCase() : (await searchCityCode(val)) || val.trim().toUpperCase());

    const originLocationCode = await ensureCode(originInput);
    const destinationLocationCode = await ensureCode(destinationInput);

    const data = await searchFlightOffers({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      children: isNaN(children) ? 0 : children,
      currencyCode,
      max,
      nonStop,
    });

    // Normalize a lightweight representation for the UI while keeping raw for details
    const carriers = data?.dictionaries?.carriers || {};
    const flights = (data?.data || []).map((offer: any) => {
      const price = {
        total: Number(parseFloat(offer?.price?.grandTotal || offer?.price?.total || '0').toFixed(2)),
        currency: offer?.price?.currency || currencyCode,
      };
      const itineraries = (offer?.itineraries || []).map((it: any) => {
        const segments = (it?.segments || []).map((s: any) => ({
          departure: s?.departure,
          arrival: s?.arrival,
          carrierCode: s?.carrierCode,
          carrierName: carriers[s?.carrierCode] || s?.carrierCode,
          number: s?.number,
          duration: s?.duration,
          aircraft: s?.aircraft,
        }));
        return { duration: it?.duration, segments };
      });
      const airlines = Array.from(new Set((offer?.validatingAirlineCodes || []).map((c: string) => carriers[c] || c)));
      return {
        id: offer?.id,
        price,
        airlines,
        itineraries,
        raw: offer,
      };
    });

    return NextResponse.json({ success: true, originLocationCode, destinationLocationCode, flights, carriers, raw: data });
  } catch (e: any) {
    console.error('Flights API error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
