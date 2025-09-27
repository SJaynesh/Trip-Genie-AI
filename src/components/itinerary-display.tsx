'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  ArrowLeft,
  Bus,
  CalendarDays,
  Clock,
  CloudSun,
  Coffee,
  DollarSign,
  Hotel,
  Moon,
  Sailboat,
  Sun,
  Utensils,
  TramFront,
  Ticket,
  Info,
  Plane,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { Locale } from '@/i18n-config';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { format, addDays } from 'date-fns';
import { BrandLoader } from '@/components/brand/brand-loader';
import SmartImage from '@/components/smart-image';

type Transport = {
  mode: string;
  details?: string;
  departureTime: string;
  arrivalTime: string;
  cost: string;
  from: string;
  to: string;
};

type Activity = {
  activity: string;
  description: string;
  transportToNext?: Transport;
};

type DayPlan = {
  day: string;
  title: string;
  emoji: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
  weatherAdvice?: string;
};

type EstimatedCosts = {
  food: string;
  accommodation: string;
  transportation: string;
};

type ItineraryData = {
  itinerary: DayPlan[];
  estimatedCosts?: EstimatedCosts;
  totalEstimatedCost?: string;
};

type HotelPricing = {
  id?: string;
  name?: string;
  address?: string;
  checkInDate: string;
  checkOutDate: string;
  total: { amount: number; currency: string };
  nightly: Array<{ date: string; price: number; currency: string }>;
};

type FlightPricing = {
  id?: string;
  price: { total: number; currency: string };
  airlines: string[];
  itineraries: Array<{
    duration?: string;
    segments: Array<{
      departure?: { iataCode?: string; terminal?: string; at?: string };
      arrival?: { iataCode?: string; terminal?: string; at?: string };
      carrierName?: string;
      number?: string;
      duration?: string;
    }>;
  }>;
};

const TransportCard = ({ transport }: { transport: Transport }) => (
  <div className="relative my-4 ml-12 border-l-2 border-dashed border-primary pl-8">
    <div className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full bg-background p-2">
      <Bus className="h-5 w-5 text-primary" />
    </div>
    <div className="rounded-lg bg-card p-4">
      <h5 className="font-bold">
        {transport.mode} from {transport.from} to {transport.to}
      </h5>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {transport.departureTime} - {transport.arrivalTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          <span>{transport.cost}</span>
        </div>
        {transport.details && (
           <div className="flex items-center gap-2 col-span-2">
             <Info className="h-4 w-4" />
             <span>{transport.details}</span>
           </div>
        )}
      </div>
    </div>
  </div>
);

const ActivityCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4 rounded-lg bg-card p-4">
    <div className="text-primary">{icon}</div>
    <div>
      <h4 className="font-bold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const CostCard = ({
  icon,
  title,
  cost,
}: {
  icon: React.ReactNode;
  title: string;
  cost: string;
}) => (
  <div className="flex items-center gap-4 rounded-lg bg-card p-4">
    <div className="text-accent">{icon}</div>
    <div>
      <h4 className="text-muted-foreground">{title}</h4>
      <p className="text-lg font-bold">{cost}</p>
    </div>
  </div>
);

export function ItineraryDisplay({
  dictionary,
  lang,
}: {
  dictionary: any;
  lang: Locale;
}) {
  const router = useRouter();
  const [itinerary, setItinerary] = React.useState<ItineraryData | null>(null);
  const [destination, setDestination] = React.useState<string>('');
  const [error, setError] = React.useState(false);
  const [primaryHotel, setPrimaryHotel] = React.useState<HotelPricing | null>(null);
  const [destinationHotels, setDestinationHotels] = React.useState<Array<{ destination: string; hotel: HotelPricing }>>([]);
  const [flight, setFlight] = React.useState<FlightPricing | null>(null);
  const [pricingLoading, setPricingLoading] = React.useState<boolean>(false);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const [tripStart, setTripStart] = React.useState<string | null>(null);
  const [weatherByDest, setWeatherByDest] = React.useState<Record<string, Array<{ date: string; tip: string; tMax: number; tMin: number; precipProb: number; code: number }>>>({});

  React.useEffect(() => {
    const storedItinerary = sessionStorage.getItem('itinerary');
    const storedDestination = sessionStorage.getItem('destination');
    const storedFrom = sessionStorage.getItem('travelDatesFrom');

    if (storedItinerary && storedDestination) {
      try {
        const parsedItinerary: ItineraryData = JSON.parse(storedItinerary);
        setItinerary(parsedItinerary);
        setDestination(storedDestination);
        if (storedFrom) setTripStart(storedFrom);
      } catch (e) {
        console.error('Failed to parse itinerary JSON:', e);
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [dictionary]);

  // Fetch live pricing (hotels and flights) using stored trip metadata
  React.useEffect(() => {
    const run = async () => {
      try {
        setPricingError(null);
        const origin = sessionStorage.getItem('origin') || '';
        const from = sessionStorage.getItem('travelDatesFrom') || '';
        const to = sessionStorage.getItem('travelDatesTo') || '';
        const travelers = Number(sessionStorage.getItem('travelers') || '1');
        const children = Number(sessionStorage.getItem('children') || '0');
        const rooms = Number(sessionStorage.getItem('rooms') || '1');
        const currency = sessionStorage.getItem('currency') || 'USD';
        let destinations: string[] = [];
        try {
          destinations = JSON.parse(sessionStorage.getItem('destinationsJSON') || '[]') || [];
        } catch {}
        if (!destinations.length && destination) destinations = [destination];
        if (!destination || !from || !to) return;
        setPricingLoading(true);
        // Fetch hotels for each destination
        const adultsForHotels = travelers + (isNaN(children) ? 0 : children);
        const hotelPromises = destinations.map((dest) =>
          fetch(`/api/hotels?city=${encodeURIComponent(dest)}&checkInDate=${from}&checkOutDate=${to}&adults=${adultsForHotels}&roomQuantity=${rooms}&currency=${currency}`)
        );
        const flightPromise = origin
          ? fetch(`/api/flights?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departureDate=${from}&returnDate=${to}&adults=${travelers}&children=${children}&currencyCode=${currency}`)
          : Promise.resolve(null as any);
        const results = await Promise.all([...hotelPromises, flightPromise]);

        const hotelsCollected: Array<{ destination: string; hotel: HotelPricing }> = [];
        for (let i = 0; i < destinations.length; i++) {
          const res = results[i];
          if (res && res.ok) {
            const j = await res.json();
            if (j?.success && Array.isArray(j.hotels) && j.hotels.length > 0) {
              const selected = j.hotels[0];
              const h: HotelPricing = {
                id: selected.id,
                name: selected.name,
                address: selected.address,
                checkInDate: selected.checkInDate,
                checkOutDate: selected.checkOutDate,
                total: selected.total,
                nightly: selected.nightly,
              };
              hotelsCollected.push({ destination: destinations[i], hotel: h });
            }
          } else if (res) {
            const t = await res.text();
            console.warn('Hotels fetch failed:', t);
          }
        }
        setDestinationHotels(hotelsCollected);
        if (hotelsCollected.length > 0) setPrimaryHotel(hotelsCollected[0].hotel);

        // The flight promise is appended after all hotel promises,
        // so it is always at index destinations.length.
        const fRes = results[destinations.length];
        if (fRes) {
          if (fRes.ok) {
            const j = await fRes.json();
            if (j?.success && Array.isArray(j.flights) && j.flights.length > 0) {
              setFlight(j.flights[0]);
            }
          } else {
            const t = await fRes.text();
            console.warn('Flights fetch failed:', t);
          }
        }

        // Fetch real-time weather for each destination for the whole date range
        const uniqueDests = Array.from(new Set(destinations.filter(Boolean)));
        const weatherPromises = uniqueDests.map((dest) =>
          fetch(`/api/weather?city=${encodeURIComponent(dest)}&from=${from}&to=${to}`)
        );
        const weatherRes = await Promise.all(weatherPromises);
        const map: Record<string, Array<{ date: string; tip: string; tMax: number; tMin: number; precipProb: number; code: number }>> = {};
        for (let i = 0; i < uniqueDests.length; i++) {
          const r = weatherRes[i];
          if (r && r.ok) {
            try {
              const j = await r.json();
              if (j?.success && Array.isArray(j.forecasts)) {
                map[uniqueDests[i]] = j.forecasts;
              }
            } catch (e) {
              console.warn('Weather parse failed for', uniqueDests[i], e);
            }
          } else if (r) {
            const t = await r.text();
            console.warn('Weather fetch failed:', t);
          }
        }
        setWeatherByDest(map);
      } catch (e: any) {
        console.error(e);
        setPricingError(e?.message || 'Failed to fetch live pricing');
      } finally {
        setPricingLoading(false);
      }
    };
    run();
  }, [destination]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Sailboat className="h-16 w-16 text-primary" />
        <h1 className="mt-4 font-headline text-3xl font-bold">
          {dictionary.itineraryDisplay.error.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {dictionary.itineraryDisplay.error.description}
        </p>
        <Button onClick={() => router.push(`/${lang}`)} className="mt-6">
          <ArrowLeft />
          <span>{dictionary.itineraryDisplay.error.button}</span>
        </Button>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <BrandLoader fullscreen label={dictionary.itineraryDisplay.loading} sublabel="Fetching live prices and weather..." />
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 animate-fade-in">
      <div className="mx-auto mb-12 max-w-4xl">
        <Button variant="outline" onClick={() => router.push(`/${lang}`)}>
          <ArrowLeft />
          <span>{dictionary.itineraryDisplay.backButton}</span>
        </Button>
        <div className="mt-6 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            {dictionary.itineraryDisplay.title}
          </h1>
          <p className="mt-3 text-2xl text-foreground/80">
            {dictionary.itineraryDisplay.for} {destination}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl gap-12">
        {pricingLoading && (
          <BrandLoader label="Fetching live flight & hotel prices…" sublabel="Grabbing best offers in real-time" />
        )}
        {pricingError && (
          <Alert className="animate-scale-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Live pricing</AlertTitle>
            <AlertDescription>
              {pricingError}
            </AlertDescription>
          </Alert>
        )}

        {flight && (
          <Card className="shadow-lg animate-scale-in overflow-hidden">
            <div className="relative h-36 w-full">
              <SmartImage
                src={`https://images.unsplash.com/photo-1484387436194-cf7cb70800e0?q=80&w=1600&auto=format&fit=crop`}
                alt="Flight"
                fill
                className="object-cover animate-kenburns"
                priority
                forceUnoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-2xl md:text-3xl text-center flex items-center justify-center gap-2">
                <Plane className="h-7 w-7 text-primary" /> Flight Offer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {flight.price.currency} {flight.price.total.toFixed(2)}
                </div>
                {flight.airlines?.length > 0 && (
                  <div className="text-muted-foreground">{flight.airlines.join(', ')}</div>
                )}
              </div>
              {flight.itineraries?.[0]?.segments && (
                <div className="rounded-lg bg-card p-4">
                  <div className="font-semibold mb-2">Outbound</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {flight.itineraries[0].segments.map((s, idx) => {
                      const dep = s.departure?.at ? new Date(s.departure.at) : null;
                      const arr = s.arrival?.at ? new Date(s.arrival.at) : null;
                      return (
                        <div key={idx} className="flex flex-wrap items-center gap-2">
                          <span>{s.departure?.iataCode}</span>
                          <span>{dep ? format(dep, 'PPp') : ''}</span>
                          <span>→</span>
                          <span>{s.arrival?.iataCode}</span>
                          <span>{arr ? format(arr, 'PPp') : ''}</span>
                          <span>• {s.carrierName} {s.number}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {flight.itineraries?.[1]?.segments && (
                <div className="rounded-lg bg-card p-4">
                  <div className="font-semibold mb-2">Return</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {flight.itineraries[1].segments.map((s, idx) => {
                      const dep = s.departure?.at ? new Date(s.departure.at) : null;
                      const arr = s.arrival?.at ? new Date(s.arrival.at) : null;
                      return (
                        <div key={idx} className="flex flex-wrap items-center gap-2">
                          <span>{s.departure?.iataCode}</span>
                          <span>{dep ? format(dep, 'PPp') : ''}</span>
                          <span>→</span>
                          <span>{s.arrival?.iataCode}</span>
                          <span>{arr ? format(arr, 'PPp') : ''}</span>
                          <span>• {s.carrierName} {s.number}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {primaryHotel && (
          <Card className="shadow-lg animate-scale-in overflow-hidden">
            <div className="relative h-40 w-full">
              <SmartImage
                src={`https://images.unsplash.com/photo-1501117716987-c8e0041eba62?q=80&w=1600&auto=format&fit=crop`}
                alt={primaryHotel.name || 'Hotel'}
                fill
                className="object-cover animate-kenburns"
                forceUnoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-2xl md:text-3xl text-center flex items-center justify-center gap-2">
                <Hotel className="h-7 w-7 text-primary" /> Accommodation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-xl font-bold">{primaryHotel.name}</div>
                {primaryHotel.address && (
                  <div className="text-muted-foreground">{primaryHotel.address}</div>
                )}
                <div className="mt-2 text-3xl font-bold text-primary">
                  {primaryHotel.total.currency} {primaryHotel.total.amount.toFixed(2)}
                </div>
                <div className="text-muted-foreground text-sm">
                  {format(new Date(primaryHotel.checkInDate), 'PP')} – {format(new Date(primaryHotel.checkOutDate), 'PP')}
                </div>
              </div>
              {Array.isArray(primaryHotel.nightly) && primaryHotel.nightly.length > 0 && (
                <div className="rounded-lg bg-card p-4">
                  <div className="font-semibold mb-2">Per-night breakdown</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {primaryHotel.nightly.map((n) => (
                      <div key={n.date} className="flex items-center justify-between">
                        <span>{format(new Date(n.date), 'PP')}</span>
                        <span>
                          {n.currency} {n.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {destinationHotels.length > 1 && (
          <Card className="shadow-lg animate-scale-in">
            <CardHeader>
              <CardTitle className="font-headline text-2xl md:text-3xl text-center">
                Other Accommodations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {destinationHotels.slice(1).map(({ destination: dest, hotel }) => (
                <div key={dest} className="rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-20 overflow-hidden rounded-md">
                      <SmartImage
                        src={`https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?q=80&w=800&auto=format&fit=crop`}
                        alt={hotel.name || 'Hotel'}
                        fill
                        className="object-cover"
                        forceUnoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{hotel.name}</div>
                      {hotel.address && (
                        <div className="text-muted-foreground">{hotel.address}</div>
                      )}
                    </div>
                    <div className="text-right font-semibold whitespace-nowrap">
                      {hotel.total.currency} {hotel.total.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {itinerary.estimatedCosts && itinerary.totalEstimatedCost && (
          <Card className="shadow-lg animate-scale-in">
            <CardHeader>
              <CardTitle className="font-headline text-2xl md:text-3xl text-center flex items-center justify-center gap-2">
                <DollarSign className="h-8 w-8 text-primary"/>
                {dictionary.itineraryDisplay.budgetOverview.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CostCard icon={<Utensils />} title={dictionary.itineraryDisplay.budgetOverview.food} cost={itinerary.estimatedCosts.food} />
                <CostCard icon={<Hotel />} title={dictionary.itineraryDisplay.budgetOverview.accommodation} cost={itinerary.estimatedCosts.accommodation} />
                <CostCard icon={<TramFront />} title={dictionary.itineraryDisplay.budgetOverview.transport} cost={itinerary.estimatedCosts.transportation} />
              </div>
              <div className="text-center rounded-lg bg-card p-4 border-t-4 border-primary">
                  <h4 className="font-bold text-lg text-muted-foreground">{dictionary.itineraryDisplay.budgetOverview.total}</h4>
                  <p className="text-3xl font-headline font-bold text-primary">{itinerary.totalEstimatedCost}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="font-headline text-3xl text-center mb-6 font-bold flex items-center justify-center gap-2"><CalendarDays className="h-8 w-8 text-primary"/>{dictionary.itineraryDisplay.dailyPlanTitle}</h2>
          <Accordion type="single" collapsible defaultValue="item-0">
            {itinerary.itinerary.map((day, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="mb-4 rounded-lg border-b-0 bg-card shadow-lg"
              >
                <AccordionTrigger className="w-full p-6 text-left hover:no-underline">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{day.emoji}</span>
                    <div>
                      <h3 className="font-headline text-2xl font-bold text-accent">
                        {day.day}: {day.title}
                      </h3>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0">
                  <div className="space-y-4">
                    {(() => {
                      // Determine which destination this day belongs to using user allocation if provided
                      let assignedDest = '';
                      const totalDays = itinerary.itinerary.length;
                      const destsStr = sessionStorage.getItem('destinationsJSON');
                      let dests: string[] = [];
                      try { dests = destsStr ? JSON.parse(destsStr) : []; } catch {}
                      if (!dests.length && destination) dests = [destination];
                      if (dests.length > 0) {
                        const allocStr = sessionStorage.getItem('destinationDaysJSON');
                        let alloc: number[] = [];
                        try { alloc = allocStr ? JSON.parse(allocStr) : []; } catch {}
                        const sum = Array.isArray(alloc) ? alloc.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
                        let destIdx = 0;
                        if (Array.isArray(alloc) && alloc.length === dests.length && sum > 0) {
                          const dayNumber = index + 1; // 1-indexed day
                          let cumulative = 0;
                          for (let i = 0; i < alloc.length; i++) {
                            cumulative += Number(alloc[i]) || 0;
                            if (dayNumber <= cumulative) { destIdx = i; break; }
                            if (i === alloc.length - 1) destIdx = alloc.length - 1;
                          }
                        } else {
                          // fallback: even split
                          destIdx = Math.min(dests.length - 1, Math.floor((index * dests.length) / totalDays));
                        }
                        assignedDest = dests[destIdx];
                      }
                      const dateStr = tripStart ? format(addDays(new Date(tripStart), index), 'yyyy-MM-dd') : '';
                      const forecasts = assignedDest ? weatherByDest[assignedDest] : undefined;
                      const tip = forecasts?.find((f) => f.date === dateStr)?.tip;
                      if (!tip) return null;
                      return (
                        <Alert>
                          <CloudSun className="h-4 w-4" />
                          <AlertTitle>{dictionary.itineraryDisplay.weatherTip}</AlertTitle>
                          <AlertDescription>
                            {tip}
                          </AlertDescription>
                        </Alert>
                      );
                    })()}
                    <ActivityCard
                      icon={<Coffee />}
                      title={day.morning.activity}
                      description={day.morning.description}
                    />
                    {day.morning.transportToNext && (
                      <TransportCard transport={day.morning.transportToNext} />
                    )}
                    <ActivityCard
                      icon={<Sun />}
                      title={day.afternoon.activity}
                      description={day.afternoon.description}
                    />
                     {day.afternoon.transportToNext && (
                      <TransportCard transport={day.afternoon.transportToNext} />
                    )}
                    <ActivityCard
                      icon={<Moon />}
                      title={day.evening.activity}
                      description={day.evening.description}
                    />
                    {tripStart && (() => {
                      // Assign destination and pick that destination's hotel (fallback primary) using user allocation if provided
                      const totalDays = itinerary.itinerary.length;
                      const destsStr = sessionStorage.getItem('destinationsJSON');
                      let dests: string[] = [];
                      try { dests = destsStr ? JSON.parse(destsStr) : []; } catch {}
                      if (!dests.length && destination) dests = [destination];
                      if (!dests.length) return null;
                      const allocStr = sessionStorage.getItem('destinationDaysJSON');
                      let alloc: number[] = [];
                      try { alloc = allocStr ? JSON.parse(allocStr) : []; } catch {}
                      const sum = Array.isArray(alloc) ? alloc.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
                      let destIdx = 0;
                      if (Array.isArray(alloc) && alloc.length === dests.length && sum > 0) {
                        const dayNumber = index + 1;
                        let cumulative = 0;
                        for (let i = 0; i < alloc.length; i++) {
                          cumulative += Number(alloc[i]) || 0;
                          if (dayNumber <= cumulative) { destIdx = i; break; }
                          if (i === alloc.length - 1) destIdx = alloc.length - 1;
                        }
                      } else {
                        destIdx = Math.min(dests.length - 1, Math.floor((index * dests.length) / totalDays));
                      }
                      const assignedDest = dests[destIdx];
                      const dh = destinationHotels.find((d) => d.destination === assignedDest)?.hotel || primaryHotel;
                      if (!dh) return null;
                      const dateStr = format(addDays(new Date(tripStart), index), 'yyyy-MM-dd');
                      const night = dh.nightly?.find((n) => n.date === dateStr);
                      if (!night) return null;
                      return (
                        <div className="rounded-lg bg-card p-4 border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Hotel className="h-5 w-5 text-primary" />
                              <span className="font-semibold">{dh.name}</span>
                            </div>
                            <div className="text-primary font-bold">
                              {night.currency} {night.price.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Nightly rate for {format(new Date(night.date), 'PP')} ({assignedDest})
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
