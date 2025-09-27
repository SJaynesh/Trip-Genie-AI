'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { format, differenceInCalendarDays } from 'date-fns';
import { CalendarIcon, PlaneTakeoff, MapPin, Hotel } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { DateRange } from 'react-day-picker';
import { BrandLoader } from '@/components/brand/brand-loader';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n-config';

const travelStyles = [
  { id: 'adventure', label: 'Adventure & Outdoors' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'historical', label: 'Historical Sites' },
  { id: 'foodie', label: 'Foodie' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'culture', label: 'Art & Culture' },
] as const;

const formSchema = z
  .object({
    origin: z.string().min(2, {
      message: 'Origin must be at least 2 characters.',
    }),
    destinations: z.array(z.string().min(2)).min(1, { message: 'Please add at least one destination.' }),
    destinationDays: z.array(z.coerce.number().min(0)).optional(),
    currency: z.string().min(3).max(3),
    travelDates: z.object({
      from: z.date(),
      to: z.date(),
    }),
    budget: z.string().min(1, { message: 'Please enter a budget.' }),
    travelers: z.coerce
      .number()
      .min(1, { message: 'Must have at least 1 adult traveler.' }),
    children: z.coerce.number().min(0).default(0),
    rooms: z.coerce.number().min(1).default(1),
    travelStyle: z
      .array(z.string())
      .refine((value) => value.some((item) => item), {
        message: 'You have to select at least one travel style.',
      }),
    dreamTrip: z
      .string()
      .min(10, {
        message: 'Please describe your dream trip in at least 10 characters.',
      })
      .max(1000, { message: 'Description must be 1000 characters or less.' }),
  })
  .refine((data) => data.travelDates.from && data.travelDates.to, {
    message: 'Please select a start and end date for your trip.',
    path: ['travelDates'],
  });

export function TripForm({ dictionary, lang }: { dictionary: any, lang: Locale }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: '',
      destinations: [''],
      destinationDays: [0],
      currency: 'USD',
      budget: '',
      travelers: 1,
      children: 0,
      rooms: 1,
      travelStyle: [],
      dreamTrip: '',
    },
  });

  const { fields: destinationFields, append: appendDestination, remove: removeDestination } = useFieldArray<any>({
    control: form.control,
    name: 'destinations' as any,
  });

  // Keep destinationDays length in sync with destinations length
  React.useEffect(() => {
    const destCount = destinationFields.length;
    const days = form.getValues('destinationDays') || [];
    if (days.length < destCount) {
      form.setValue('destinationDays', [...days, ...new Array(destCount - days.length).fill(0)], { shouldDirty: true });
    } else if (days.length > destCount) {
      form.setValue('destinationDays', days.slice(0, destCount), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationFields.length]);

  // Add/remove destination while keeping destinationDays in lockstep to avoid uncontrolled inputs
  const handleAddDestination = React.useCallback(() => {
    const currentDays = form.getValues('destinationDays') || [];
    form.setValue('destinationDays', [...currentDays, 0], { shouldDirty: true });
    appendDestination('' as any);
  }, [appendDestination, form]);

  const handleRemoveDestination = React.useCallback((idx: number) => {
    const currentDays = [...(form.getValues('destinationDays') || [])];
    if (idx >= 0 && idx < currentDays.length) {
      currentDays.splice(idx, 1);
      form.setValue('destinationDays', currentDays, { shouldDirty: true });
    }
    removeDestination(idx);
  }, [form, removeDestination]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Convert selected style IDs into localized labels for the AI prompt
      const localizedStyles = values.travelStyle.map((id) => {
        const key = id as keyof typeof dictionary.tripForm.travelStyle.options;
        return dictionary.tripForm.travelStyle.options[key] ?? id;
      });
      const payload = {
        ...values,
        destination: values.destinations[0] ?? '',
        destinationDays: (values.destinationDays || []).slice(0, values.destinations.length),
        travelStyle: localizedStyles,
      } as any;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.success && result.itinerary) {
        sessionStorage.setItem('itinerary', result.itinerary);
        // Save destinations for display and pricing (first used as primary)
        try {
          sessionStorage.setItem('destinationsJSON', JSON.stringify(values.destinations));
          sessionStorage.setItem('destination', values.destinations[0] ?? '');
        } catch {}
        // Persist details used for Amadeus API calls
        try {
          sessionStorage.setItem('origin', values.origin);
          sessionStorage.setItem('travelDatesFrom', format(values.travelDates.from, 'yyyy-MM-dd'));
          sessionStorage.setItem('travelDatesTo', format(values.travelDates.to, 'yyyy-MM-dd'));
          sessionStorage.setItem('travelers', String(values.travelers));
          sessionStorage.setItem('children', String(values.children ?? 0));
          sessionStorage.setItem('rooms', String(values.rooms ?? 1));
          sessionStorage.setItem('currency', values.currency);
          sessionStorage.setItem('destinationDaysJSON', JSON.stringify((values.destinationDays || []).slice(0, values.destinations.length)));
        } catch (e) {
          console.warn('Failed to persist trip metadata to sessionStorage', e);
        }
        router.push(`/${lang}/itinerary`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Oh no! Something went wrong.',
          description:
            result?.error ||
            'There was a problem generating your itinerary. Please try again.',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="inline-flex items-center gap-2">
                <PlaneTakeoff className="h-4 w-4 text-primary" />
                {dictionary?.tripForm?.origin?.label ?? 'Origin (City or IATA code)'}
              </FormLabel>
              <FormControl>
                <Input placeholder={dictionary?.tripForm?.origin?.placeholder ?? 'e.g., NYC or New York'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
          <FormLabel className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-secondary" />
            {dictionary?.tripForm?.destinations?.label ?? 'Destinations'}
          </FormLabel>
          {destinationFields.map((f, idx) => (
            <div key={f.id} className="grid grid-cols-12 gap-2 items-end">
              <FormField
                control={form.control}
                name={`destinations.${idx}` as const}
                render={({ field }) => (
                  <FormItem className="col-span-7 md:col-span-8">
                    <FormControl>
                      <Input placeholder={dictionary?.tripForm?.destinations?.placeholder ?? 'e.g., Paris'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`destinationDays.${idx}` as const}
                render={({ field }) => (
                  <FormItem className="col-span-3 md:col-span-2">
                    <FormLabel className="text-xs md:text-sm">{dictionary?.tripForm?.destinations?.daysLabel ?? 'Days'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={typeof field.value === 'number' ? field.value : 0}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          field.onChange(Number.isFinite(n) && n >= 0 ? n : 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="outline" onClick={() => handleRemoveDestination(idx)}>
                {dictionary?.tripForm?.destinations?.remove ?? 'Remove'}
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={handleAddDestination}>
            {dictionary?.tripForm?.destinations?.add ?? 'Add Destination'}
          </Button>
          {(() => {
            const { from, to } = form.getValues('travelDates') || ({} as any);
            const total = from && to ? differenceInCalendarDays(new Date(to), new Date(from)) + 1 : 0;
            const allocated = (form.getValues('destinationDays') || []).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            return (
              <div className="text-sm text-muted-foreground">
                {(dictionary?.tripForm?.destinations?.daysSummary || 'Allocated {{allocated}} of {{total}} trip days')
                  .replace('{{allocated}}', String(allocated))
                  .replace('{{total}}', String(total))}
              </div>
            );
          })()}
        </div>
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dictionary?.tripForm?.currency?.label ?? 'Currency'}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={dictionary?.tripForm?.currency?.placeholder ?? 'Select currency'} />
                  </SelectTrigger>
                  <SelectContent>
                    {['USD','EUR','GBP','INR','JPY','AED','AUD','CAD','SGD'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="travelDates"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{dictionary.tripForm.travelDates.label}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value?.from && 'text-muted-foreground'
                        )}
                      >
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, 'LLL dd, y')} -{' '}
                              {format(field.value.to, 'LLL dd, y')}
                            </>
                          ) : (
                            format(field.value.from, 'LLL dd, y')
                          )
                        ) : (
                          <span>{dictionary.tripForm.travelDates.placeholder}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={{
                        from: field.value?.from,
                        to: field.value?.to,
                      }}
                      onSelect={(range) =>
                        field.onChange(range as DateRange)
                      }
                      numberOfMonths={2}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dictionary.tripForm.budget.label}</FormLabel>
                <FormControl>
                  <Input placeholder={dictionary.tripForm.budget.placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="travelers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dictionary.tripForm.travelers.label}</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="children"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dictionary?.tripForm?.children?.label ?? 'Children'}</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-secondary" />
                  {dictionary?.tripForm?.rooms?.label ?? 'Rooms'}
                </FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="travelStyle"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>{dictionary.tripForm.travelStyle.label}</FormLabel>
                <FormDescription>
                  {dictionary.tripForm.travelStyle.description}
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {travelStyles.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="travelStyle"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...field.value,
                                      item.id,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {dictionary.tripForm.travelStyle.options[item.id]}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dreamTrip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dictionary.tripForm.dreamTrip.label}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={dictionary.tripForm.dreamTrip.placeholder}
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full text-lg relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow"
          size="lg"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? (
            <span className="flex items-center gap-3">
              <span className="relative h-5 w-14">
                <PlaneTakeoff className="absolute left-0 top-1/2 -translate-y-1/2 plane text-primary" />
                <Hotel className="absolute right-0 top-1/2 -translate-y-1/2 hotel text-secondary" />
              </span>
              <span className="inline-flex items-baseline">
                <span>{dictionary.tripForm.submit.pending}</span>
                <span className="ml-1 inline-flex">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </span>
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <PlaneTakeoff />
              <span>{dictionary.tripForm.submit.default}</span>
            </span>
          )}
          {/* Loader animations */}
          <style jsx>{`
            @keyframes blink { 0%, 80%, 100% { opacity: 0 } 40% { opacity: 1 } }
            .dot { animation: blink 1.4s infinite both; }
            .dot:nth-child(2) { animation-delay: .2s; }
            .dot:nth-child(3) { animation-delay: .4s; }

            @keyframes planePath {
              0% { transform: translateX(0) translateY(0) rotate(0deg); }
              50% { transform: translateX(18px) translateY(-6px) rotate(-10deg); }
              100% { transform: translateX(0) translateY(0) rotate(0deg); }
            }
            .plane { animation: planePath 1.1s ease-in-out infinite; }
            @keyframes hotelFloat {
              0% { transform: translateY(0) scale(1); opacity: .9; }
              50% { transform: translateY(-4px) scale(1.02); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: .9; }
            }
            .hotel { animation: hotelFloat 1.3s ease-in-out infinite; }
          `}</style>
        </Button>
        {isPending && (
          <BrandLoader
            fullscreen
            label="Preparing your itinerary"
            sublabel="Finding flights, hotels, and local tips"
          />
        )}
      </form>
    </Form>
  );
}
