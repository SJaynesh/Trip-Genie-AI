import { NextResponse } from 'next/server';
import { differenceInCalendarDays, addDays } from 'date-fns';
import { searchCityCode, listHotelsByCity, searchHotelOffersByHotelIds } from '@/lib/amadeus';

function toISODate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cityInput = url.searchParams.get('city') || url.searchParams.get('cityCode');
    const checkInDate = url.searchParams.get('checkInDate');
    const checkOutDate = url.searchParams.get('checkOutDate');
    const adults = Number(url.searchParams.get('adults') || '2');
    const currency = url.searchParams.get('currency') || 'USD';
    const roomQuantity = Number(url.searchParams.get('roomQuantity') || '1');

    if (!cityInput || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required params: city, checkInDate, checkOutDate' },
        { status: 400 }
      );
    }

    let cityCode = cityInput.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(cityCode)) {
      const resolved = await searchCityCode(cityInput);
      if (!resolved) {
        return NextResponse.json(
          { success: false, error: 'Unable to resolve city code from the provided city keyword.' },
          { status: 400 }
        );
      }
      cityCode = resolved;
    }

    // Step 1: Get hotelIds for this city
    const hotelsList = await listHotelsByCity(cityCode);
    const hotelIds: string[] = (hotelsList?.data || [])
      .map((h: any) => h?.hotelId || h?.id)
      .filter(Boolean);

    if (!hotelIds.length) {
      return NextResponse.json({ success: true, cityCode, hotels: [] });
    }

    // Step 2: Fetch offers for these hotelIds, chunked to avoid overly long URLs
    const chunkSize = 20;
    const chunks: string[][] = [];
    for (let i = 0; i < hotelIds.length; i += chunkSize) {
      chunks.push(hotelIds.slice(i, i + chunkSize));
    }

    let combined: any[] = [];
    for (const ids of chunks) {
      const res = await searchHotelOffersByHotelIds({
        hotelIds: ids,
        adults,
        checkInDate,
        checkOutDate,
        currency,
        roomQuantity,
        bestRateOnly: true,
      });
      if (Array.isArray(res?.data)) {
        combined = combined.concat(res.data);
      }
    }

    const nights = Math.max(1, differenceInCalendarDays(new Date(checkOutDate), new Date(checkInDate)));

    const hotels = (combined || []).map((item: any) => {
      const hotel = item?.hotel || {};
      const offers: any[] = Array.isArray(item?.offers) ? item.offers : [];
      // Pick cheapest offer
      const cheapest = offers.reduce((acc, o) => {
        const total = parseFloat(o?.price?.total || '0');
        if (!acc || total < acc._totalNum) return { ...o, _totalNum: total };
        return acc;
      }, null as any);

      const total = cheapest?._totalNum || 0;
      const curr = cheapest?.price?.currency || currency;

      // Attempt to extract nightly pricing from variations if present
      let nightly: { date: string; price: number; currency: string }[] = [];
      const variations = cheapest?.price?.variations;
      if (variations?.changes && Array.isArray(variations.changes) && variations.changes.length > 0) {
        // Expand any ranges into per-night entries
        const from = new Date(checkInDate);
        for (let i = 0; i < nights; i++) {
          const day = addDays(from, i);
          const dayStr = toISODate(day);
          // Find the change bucket whose startDate <= day < endDate (end exclusive if provided)
          const bucket = variations.changes.find((c: any) => {
            const start = new Date(c.startDate || c.start);
            const endRaw = c.endDate || c.end;
            const end = endRaw ? new Date(endRaw) : addDays(start, 1);
            return day >= start && day < end;
          });
          const nightPrice = bucket?.total
            ? parseFloat(bucket.total) / Math.max(1, differenceInCalendarDays(new Date(bucket.endDate || bucket.end || addDays(new Date(bucket.startDate || bucket.start), 1)), new Date(bucket.startDate || bucket.start)))
            : total / nights;
          nightly.push({ date: dayStr, price: Number(nightPrice.toFixed(2)), currency: curr });
        }
      } else if (variations?.average?.base) {
        // Some responses include an average nightly base
        const avg = parseFloat(variations.average.base);
        const from = new Date(checkInDate);
        for (let i = 0; i < nights; i++) {
          nightly.push({ date: toISODate(addDays(from, i)), price: Number(avg.toFixed(2)), currency: curr });
        }
      } else {
        // Evenly distribute
        const perNight = total / nights;
        const from = new Date(checkInDate);
        for (let i = 0; i < nights; i++) {
          nightly.push({ date: toISODate(addDays(from, i)), price: Number(perNight.toFixed(2)), currency: curr });
        }
      }

      return {
        id: hotel?.hotelId || hotel?.id,
        name: hotel?.name,
        rating: hotel?.rating,
        address: hotel?.address?.lines?.join(', ') || hotel?.address?.cityName || '',
        checkInDate,
        checkOutDate,
        total: { amount: Number(total.toFixed(2)), currency: curr },
        nightly,
        raw: { hotel, offers: cheapest ? [cheapest] : offers },
      };
    });

    // Sort by total ascending to have the cheapest first
    hotels.sort((a, b) => a.total.amount - b.total.amount);

    return NextResponse.json({ success: true, cityCode, hotels });
  } catch (e: any) {
    console.error('Hotels API error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
