// This is a server-side file.
'use server';

/**
 * @fileOverview Generates a personalized travel itinerary based on user inputs, real-time weather, and local events.
 *
 * - generatePersonalizedItinerary - A function that generates a personalized travel itinerary.
 * - GeneratePersonalizedItineraryInput - The input type for the generatePersonalizedItinerary function.
 * - GeneratePersonalizedItineraryOutput - The return type for the generatePersonalizedItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// import { displayWeatherAction } from './display-weather-action';

// Input schema for the itinerary generation
const GeneratePersonalizedItineraryInputSchema = z.object({
  destination: z.string().describe('Primary destination.') ,
  destinations: z.array(z.string()).optional().describe('Optional list of multiple destinations, including the primary.'),
  destinationDays: z.array(z.number()).optional().describe('Optional list of day counts mapping to each destination in order.'),
  travelDates: z.string().describe('The start and end dates of the trip.'),
  budget: z.string().describe("The user's approximate budget (e.g., 'around $1500 USD')."),
  travelers: z.number().describe('Total number of travelers (adults + children).'),
  children: z.number().optional().describe('Number of children (if any).'),
  rooms: z.number().optional().describe('Number of rooms to plan for.'),
  currency: z.string().optional().describe('Preferred currency code (e.g., USD, EUR).'),
  travelStyle: z.array(z.string()).describe('An array of travel styles the user prefers (e.g., ["Adventure", "Foodie"]).'),
  dreamTrip: z.string().describe('A detailed description of the user\'s ideal trip.'),
});
export type GeneratePersonalizedItineraryInput = z.infer<typeof GeneratePersonalizedItineraryInputSchema>;

const TransportSchema = z.object({
  mode: z.string().describe("Mode of transport (e.g., 'Bus', 'Subway', 'Walk')."),
  details: z.string().optional().describe("Name of the flight, bus line, or train number (e.g., 'American Airlines AA250', 'Greyhound', 'Metro Line 2')."),
  departureTime: z.string().describe("Estimated departure time (e.g., '1:00 PM')."),
  arrivalTime: z.string().describe("Estimated arrival time (e.g., '1:30 PM')."),
  cost: z.string().describe("Estimated cost of the transport (e.g., '$2.75 USD')."),
  from: z.string().describe("Starting point of the journey."),
  to: z.string().describe("Destination of the journey."),
}).optional();

const ActivitySchema = z.object({
  activity: z.string().describe('A short title for the activity.'),
  description: z.string().describe('A detailed description of the plan.'),
  transportToNext: TransportSchema.describe('Transportation details to the next activity.'),
});

// Output schema for the itinerary
const GeneratePersonalizedItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      day: z.string().describe('The day number, e.g., "Day 1", "Day 2".'),
      title: z.string().describe('A catchy title for the day\'s plan.'),
      emoji: z.string().describe('An emoji that represents the day\'s activities.'),
      morning: ActivitySchema,
      afternoon: ActivitySchema,
      evening: ActivitySchema,
      weatherAdvice: z.string().optional().describe('Actionable advice based on the day\'s weather forecast. Only include if there is specific advice.'),
    })
  ).describe('A day-by-day travel itinerary.'),
  estimatedCosts: z.object({
    food: z.string().describe("An estimated cost for food for the entire trip, formatted as a string (e.g., '$300 - $500 USD')."),
    accommodation: z.string().describe("An estimated cost for accommodation for the entire trip, formatted as a string (e.g., '$800 - $1200 USD')."),
    transportation: z.string().describe("An estimated cost for local transportation for the entire trip, formatted as a string (e.g., '$100 - $150 USD').")
  }).describe("An object containing estimated costs for the trip."),
  totalEstimatedCost: z.string().describe("The total estimated cost for the trip, formatted as a string (e.g., '$1200 - $1850 USD'). This should be the sum of food, accommodation, and transportation estimates."),
});

export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;


export async function generatePersonalizedItinerary(
  input: GeneratePersonalizedItineraryInput
): Promise<GeneratePersonalizedItineraryOutput> {
  return generateItineraryFlow(input);
}


const itineraryPrompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: { schema: GeneratePersonalizedItineraryInputSchema },
  output: { schema: GeneratePersonalizedItineraryOutputSchema },
  prompt: `
You are an expert travel agent and logistics planner with the persona of a knowledgeable and enthusiastic guide. Your task is to create a highly personalized, practical, and dynamic day-by-day travel itinerary in a structured JSON format.

User's Trip Data:
- Primary Destination: {{{destination}}}
- Additional Destinations: {{#if destinations}}{{#each destinations}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Day Allocation (if provided): {{#if destinationDays}}{{#each destinationDays}}{{{this}}}{{#unless @last}} / {{/unless}}{{/each}}{{else}}None{{/if}} (per destinations order)
- Travel Dates: {{{travelDates}}}
- Budget: {{{budget}}}
- Travelers (total): {{{travelers}}}
- Children: {{#if children}}{{{children}}}{{else}}0{{/if}}
- Rooms: {{#if rooms}}{{{rooms}}}{{else}}1{{/if}}
- Preferred Currency: {{#if currency}}{{{currency}}}{{else}}USD{{/if}}
- Travel Style: {{#each travelStyle}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- User's Dream Trip Description: {{{dreamTrip}}}

Real-Time Contextual Data:
- Weather Forecast: Generally sunny with some clouds. Highs around 75°F (24°C). A 20% chance of a brief afternoon shower on the third day.
- Local Events: Local farmers market at the city center (Saturdays, 9am-1pm). Live music festival at Central Park (Friday evenings). Art exhibition at the Modern Art Museum (daily).

Your Instructions:
1.  Generate a detailed, day-by-day itinerary across ALL specified destinations (if multiple). If 'destinationDays' is provided, allocate that many days to each destination in order. Otherwise, distribute days logically to minimize backtracking and travel time.
    - Clearly tailor activities to the current destination of that day.
    - If multiple destinations are provided, ensure transitions between them are logical.
2.  Crucially, you must integrate the real-time data. Weave the local events into the schedule where appropriate. The itinerary must be adapted to the weather forecast.
3.  For each activity, you MUST include transportation details to the next activity in the 'transportToNext' field. This should include the mode of transport, estimated departure and arrival times, cost, and from/to locations. Be specific (e.g., "from Central Park to Modern Art Museum"). For the last activity of the day (evening), the 'transportToNext' field can be omitted.
4.  Include the name of the transportation provider (e.g., airline, bus company, metro line) in the 'details' field of the 'transportToNext' object.
5.  Based on destinations, duration, travelers (adults + children), rooms, and budget, provide a realistic cost estimation for 'food', 'accommodation', and 'transportation' in the preferred currency when possible. Present these as a range (e.g., '$500 - $700').
6.  Calculate the 'totalEstimatedCost' by summing the lower and upper bounds of the individual cost estimates.
7.  Optimize the schedule to minimize travel time between locations where possible.
8.  For each day, provide a catchy 'title' and a relevant 'emoji'.
9.  Populate the 'weatherAdvice' field for a day if there is specific, actionable advice based on the provided weather forecast. Use the result from the 'displayWeatherAction' tool.
10. The final output must be a valid JSON object matching the provided output schema.
`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async input => {
    const { output } = await itineraryPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a valid itinerary.');
    }
    return output;
  }
);
