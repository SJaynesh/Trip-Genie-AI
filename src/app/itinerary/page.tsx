import { ItineraryDisplay } from '@/components/itinerary-display';
import { redirect } from 'next/navigation';

export default function ItineraryPage() {
  // This page is just for redirecting to the default locale.
  redirect('/en/itinerary');
}
