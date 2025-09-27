# TripGenie – One‑Click AI Trip Booking (Prototype)

TripGenie is an AI‑assisted trip planning prototype built with Next.js (App Router). It generates a personalized day‑by‑day itinerary and enriches it with real‑time hotel, flight and weather data. The UI is designed for one‑click booking flow with a modern, animated experience.

> Status: Development in progress (Prototype). Core flows work end‑to‑end using real‑time data; many improvements are coming soon (payment, auth, persistence, multi‑city refinements, and more).

## Highlights

- **AI Itinerary Generation**: Natural‑language trip brief → structured multi‑day plan.
- **Real‑Time Data**:
  - Flights via Amadeus Self‑Service API.
  - Hotels via Amadeus Self‑Service API (including per‑night breakdown when available).
  - Weather via Open‑Meteo API (free, no key) with daily tips.
- **Animated, Branded UI**:
  - New TripGenie logo and branded loader.
  - Animated hero, carousel, and subtle entrance transitions.
  - Clean, warm palette and responsive layout.
- **Single‑Click Flow**: Collect trip preferences → generate → review flight/hotel/forecast in one place.

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + custom keyframe animations
- React Hook Form + Zod validation
- Radix UI primitives + shadcn‑ui patterns
- Embla Carousel

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Environment variables

Create a `.env` in the project root (do not commit it). See `.env.example` for reference.

```bash
# Amadeus (use test environment keys for development)
AMADEUS_API_KEY=YOUR_AMADEUS_API_KEY
AMADEUS_API_SECRET=YOUR_AMADEUS_API_SECRET
AMADEUS_BASE_URL=https://test.api.amadeus.com
```

Weather data uses Open‑Meteo and requires no API key.

### 3) Run the dev server

```bash
npm run dev
```

The app runs at http://localhost:9002 by default.

## Where Things Live

- `src/app/[lang]/page.tsx` – Home (hero + Trip form)
- `src/components/trip-form.tsx` – Trip preferences form (client)
- `src/app/[lang]/itinerary/page.tsx` – Itinerary view (server)
- `src/components/itinerary-display.tsx` – Itinerary UI + live pricing/weather (client)
- `src/app/api/generate/route.ts` – AI itinerary generation
- `src/app/api/flights/route.ts` – Flights (Amadeus)
- `src/app/api/hotels/route.ts` – Hotels (Amadeus)
- `src/app/api/weather/route.ts` – Weather (Open‑Meteo)
- `src/components/brand/trip-genie-logo.tsx` – Brand logo component
- `src/components/brand/brand-loader.tsx` – Branded loader (inline/fullscreen)

## Real‑Time Data Notes

- Amadeus OAuth is handled server‑side in `src/lib/amadeus.ts` and cached in memory.
- Server routes call external APIs; no credentials are exposed to the browser.
- For production, consider secret rotation, durable caching (e.g., Redis), input validation and rate‑limiting.

## Design & Interaction

- New TripGenie logo and app icon at `src/app/icon.svg` (favicons for modern browsers).
- Animated loader and transitions via Tailwind keyframes (`tailwind.config.ts`).
- Unsplash images in the home carousel (allowed by `next.config.ts` images remote patterns).

## Roadmap (WIP)

- One‑click checkout (aggregated booking)
- Saved itineraries and accounts
- Budget and currency refinements
- Accessibility audits and localization polish
- More data providers (activities, local transport, restaurants)

## References

- Amadeus for Developers – Self‑Service APIs: https://developers.amadeus.com/
- Quick Start: https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/quick-start/
- Postman Workspace: https://postman.com/amadeus4dev/workspace/amadeus-for-developers-s-public-workspace
- Open‑Meteo Weather API: https://open-meteo.com/
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/

## License & Credits

This is a prototype for demonstration/educational purposes. API usage subject to providers’ terms. Images from Unsplash for demo.
