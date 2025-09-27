'use server';

import {
  generatePersonalizedItinerary,
  type GeneratePersonalizedItineraryInput,
} from '@/ai/flows/generate-personalized-itinerary';
import { z } from 'zod';
import { format } from 'date-fns';

const formSchema = z.object({
  destination: z.string().min(2),
  travelDates: z.object({
    from: z.date(),
    to: z.date(),
  }),
  budget: z.string().min(1),
  travelers: z.coerce.number().min(1),
  travelStyle: z.array(z.string()).min(1),
  dreamTrip: z.string().min(10).max(1000),
});

export async function generateItineraryAction(
  values: z.infer<typeof formSchema>
) {
  try {
    const travelDates = `From ${format(values.travelDates.from, 'PPP')} to ${format(
      values.travelDates.to,
      'PPP'
    )}`;

    const flowInput: GeneratePersonalizedItineraryInput = {
      ...values,
      travelDates,
    };

    const itinerary = await generatePersonalizedItinerary(flowInput);

    if (!itinerary) {
      throw new Error('AI failed to generate a valid itinerary.');
    }

    return { success: true, itinerary: JSON.stringify(itinerary) };
  } catch (error) {
    console.error('Error in generateItineraryAction:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}
