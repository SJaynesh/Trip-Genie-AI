import { NextResponse } from 'next/server'

// Free, no-key weather using Open-Meteo
// Docs: https://open-meteo.com/
// Geocoding: https://geocoding-api.open-meteo.com/v1/search?name=Paris&count=1&language=en&format=json
// Forecast:  https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

async function geocodeCity(name: string): Promise<{ latitude: number; longitude: number; resolvedName: string } | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  const result = json?.results?.[0]
  if (!result) return null
  return { latitude: result.latitude, longitude: result.longitude, resolvedName: result.name }
}

function weatherCodeCategory(code: number): 'thunder' | 'snow' | 'rain' | 'drizzle' | 'fog' | 'cloudy' | 'clear' {
  // Simplified groups per Open-Meteo weather code table
  if ([95,96,99].includes(code)) return 'thunder'
  if ([71,73,75,77,85,86].includes(code)) return 'snow'
  if ([51,53,55,56,57].includes(code)) return 'drizzle'
  if ([61,63,65,66,67,80,81,82].includes(code)) return 'rain'
  if ([45,48].includes(code)) return 'fog'
  if ([1,2,3].includes(code)) return 'cloudy'
  return 'clear' // 0
}

function buildAdvice(code: number, tMax: number, precipProb: number): string {
  const cat = weatherCodeCategory(code)
  if (cat === 'thunder') return 'Severe weather possible. Consider indoor plans and monitor local alerts.'
  if (cat === 'snow') return 'Cold and snowy. Wear warm layers and waterproof footwear.'
  if (cat === 'rain' || cat === 'drizzle' || precipProb >= 40) return 'Rain likely. Carry an umbrella or light rain jacket.'
  if (tMax >= 32) return 'Hot day. Stay hydrated, apply sunscreen, and plan shade breaks.'
  if (tMax <= 5) return 'Chilly day. Dress warmly with layers.'
  if (cat === 'fog') return 'Foggy conditions possible. Allow extra travel time and take caution.'
  if (cat === 'cloudy') return 'Partly cloudy. Comfortable for most outdoor activities.'
  return 'Clear weather. Great day for outdoor plans!'
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const city = (url.searchParams.get('city') || '').trim()
    const from = url.searchParams.get('from') || ''
    const to = url.searchParams.get('to') || ''

    if (!city || !from || !to) {
      return NextResponse.json({ success: false, error: 'Missing required params: city, from, to' }, { status: 400 })
    }

    const geo = await geocodeCity(city)
    if (!geo) {
      return NextResponse.json({ success: false, error: 'Failed to geocode city' }, { status: 404 })
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
    forecastUrl.searchParams.set('latitude', String(geo.latitude))
    forecastUrl.searchParams.set('longitude', String(geo.longitude))
    forecastUrl.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max')
    forecastUrl.searchParams.set('timezone', 'auto')
    forecastUrl.searchParams.set('start_date', from)
    forecastUrl.searchParams.set('end_date', to)

    const res = await fetch(forecastUrl.toString(), { cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ success: false, error: `Weather API error: ${text}` }, { status: 502 })
    }

    const data = await res.json()
    const daily = data?.daily
    const out: Array<{ date: string; tip: string; tMax: number; tMin: number; precipProb: number; code: number }> = []
    if (daily && Array.isArray(daily.time)) {
      for (let i = 0; i < daily.time.length; i++) {
        const date = daily.time[i]
        const code = Number(daily.weathercode?.[i] ?? 0)
        const tMax = Number(daily.temperature_2m_max?.[i] ?? 0)
        const tMin = Number(daily.temperature_2m_min?.[i] ?? 0)
        const precipProb = Number(daily.precipitation_probability_max?.[i] ?? 0)
        const tip = buildAdvice(code, tMax, precipProb)
        out.push({ date, tip, tMax, tMin, precipProb, code })
      }
    }

    return NextResponse.json({ success: true, city: geo.resolvedName, forecasts: out })
  } catch (e: any) {
    console.error('Weather API error:', e)
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
