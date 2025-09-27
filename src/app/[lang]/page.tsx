import { TripForm } from '@/components/trip-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';
import SmartImage from '@/components/smart-image';
import { TripGenieLogo } from '@/components/brand/trip-genie-logo';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Plane, MapPin, Sun } from 'lucide-react';
import { Reveal } from '@/components/reveal';

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <main className="min-h-screen w-full font-body">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(1300px_650px_at_100%_-10%,hsl(16_85%_56%/_0.12),transparent_60%),radial-gradient(1300px_650px_at_-10%_110%,hsl(198_90%_48%/_0.12),transparent_60%)] bg-[length:200%_200%] animate-bg-pan" />
        </div>

        <div className="container mx-auto px-4 pb-12 pt-10 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-5xl text-center">
            <Reveal>
              <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-foreground/70 shadow-sm backdrop-blur">
                <TripGenieLogo />
                <span>✨ {dictionary.home.subtitle}</span>
              </div>
            </Reveal>
            <h1 className="mt-4 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text font-headline text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl">
              {dictionary.home.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">
              {dictionary.home.subtitle}
            </p>
          </div>

          <Reveal>
          <div className="mx-auto mt-10 max-w-5xl">
            <Carousel className="relative" autoplayInterval={3600}>
              <CarouselContent>
                <CarouselItem>
                  <div className="relative h-64 w-full overflow-hidden rounded-2xl border bg-card shadow-lg md:h-80">
                    <SmartImage
                      src="https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1400&auto=format&fit=crop"
                      alt="Paris"
                      fill
                      className="object-cover animate-kenburns"
                      priority
                      forceUnoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-sm shadow-md backdrop-blur">
                      <MapPin className="h-4 w-4 text-primary" /> Paris, France
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="relative h-64 w-full overflow-hidden rounded-2xl border bg-card shadow-lg md:h-80">
                    <SmartImage
                      src="https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=1400&auto=format&fit=crop"
                      alt="Dubai"
                      fill
                      className="object-cover animate-kenburns"
                      forceUnoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-sm shadow-md backdrop-blur">
                      <Sun className="h-4 w-4 text-accent" /> Dubai, UAE
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="relative h-64 w-full overflow-hidden rounded-2xl border bg-card shadow-lg md:h-80">
                    <SmartImage
                      src="https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1400&auto=format&fit=crop"
                      alt="Tokyo"
                      fill
                      className="object-cover animate-kenburns"
                      forceUnoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-sm shadow-md backdrop-blur">
                      <Plane className="h-4 w-4 text-secondary" /> Tokyo, Japan
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
          </Reveal>

          <Reveal>
          <div className="mx-auto mt-12 max-w-3xl">
            <Card className="border-border/70 bg-card/70 shadow-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-headline text-center text-2xl md:text-3xl">
                  {dictionary.home.cardTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <TripForm dictionary={dictionary} lang={lang} />
              </CardContent>
            </Card>
          </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
