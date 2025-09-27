import { ItineraryDisplay } from '@/components/itinerary-display';
import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <main className="min-h-screen w-full bg-background font-body">
      <ItineraryDisplay dictionary={dictionary} lang={lang} />
    </main>
  );
}
