'use server';

/**
 * @fileOverview An AI agent that determines whether to display weather action based on forecast.
 *
 * - displayWeatherAction - A function that handles the weather action determination process.
 * - DisplayWeatherActionInput - The input type for the displayWeatherAction function.
 * - DisplayWeatherActionOutput - The return type for the displayWeatherAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DisplayWeatherActionInputSchema = z.object({
  weatherForecast: z.string().describe('The detailed weather forecast for the specified date.'),
});
export type DisplayWeatherActionInput = z.infer<typeof DisplayWeatherActionInputSchema>;

const DisplayWeatherActionOutputSchema = z.object({
  actionableAdvice: z.string().describe('Actionable advice based on the weather forecast.'),
});
export type DisplayWeatherActionOutput = z.infer<typeof DisplayWeatherActionOutputSchema>;

export async function displayWeatherAction(input: DisplayWeatherActionInput): Promise<DisplayWeatherActionOutput> {
  return displayWeatherActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'displayWeatherActionPrompt',
  input: {schema: DisplayWeatherActionInputSchema},
  output: {schema: DisplayWeatherActionOutputSchema},
  prompt: `You are an expert weather advisor. Based on the following weather forecast, provide actionable advice to the user.

Weather Forecast: {{{weatherForecast}}}

Instructions:
- If the forecast includes rain, advise the user to pack an umbrella.
- If the forecast indicates severe weather conditions (e.g., hurricane, blizzard, extreme heatwave), provide a strong advisory to avoid outdoor activities and monitor local safety alerts.
- Otherwise, indicate there are no specific weather-related actions to take.
`,
});

const displayWeatherActionFlow = ai.defineFlow(
  {
    name: 'displayWeatherActionFlow',
    inputSchema: DisplayWeatherActionInputSchema,
    outputSchema: DisplayWeatherActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
