import { NextResponse } from 'next/server'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  generatePersonalizedItinerary,
  type GeneratePersonalizedItineraryInput,
} from '@/ai/flows/generate-personalized-itinerary'

const BodySchema = z.object({
  destination: z.string().min(2).optional(),
  destinations: z.array(z.string().min(2)).optional(),
  destinationDays: z.array(z.coerce.number().min(0)).optional(),
  travelDates: z.object({
    from: z.union([z.string(), z.date()]),
    to: z.union([z.string(), z.date()]),
  }),
  budget: z.string().min(1),
  travelers: z.coerce.number().min(1), // adults
  children: z.coerce.number().min(0).optional(),
  rooms: z.coerce.number().min(1).optional(),
  currency: z.string().min(3).max(3).optional(),
  travelStyle: z.array(z.string()).min(1),
  dreamTrip: z.string().min(10).max(1000),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input.' },
        { status: 400 }
      )
    }

    const values = parsed.data
    // Coerce dates
    const fromDate = values.travelDates.from instanceof Date
      ? values.travelDates.from
      : new Date(values.travelDates.from)
    const toDate = values.travelDates.to instanceof Date
      ? values.travelDates.to
      : new Date(values.travelDates.to)

    const travelDates = `From ${format(fromDate, 'PPP')} to ${format(toDate, 'PPP')}`

    const flowInput: GeneratePersonalizedItineraryInput = {
      // Backward compatible: include both a single primary destination and the full list
      destination: (values.destinations && values.destinations[0]) || values.destination || '',
      destinations: values.destinations || (values.destination ? [values.destination] : []),
      destinationDays: values.destinationDays,
      travelDates,
      budget: values.budget,
      travelers: values.travelers + (values.children ?? 0),
      children: values.children ?? 0,
      rooms: values.rooms ?? 1,
      currency: values.currency || 'USD',
      travelStyle: values.travelStyle,
      dreamTrip: values.dreamTrip,
    }

    const itinerary = await generatePersonalizedItinerary(flowInput)
    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: 'AI failed to generate a valid itinerary.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, itinerary: JSON.stringify(itinerary) })
  } catch (error) {
    console.error('Error in /api/generate:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
