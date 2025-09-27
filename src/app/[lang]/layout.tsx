import { Locale, i18n } from '@/i18n-config'
import type { Metadata } from 'next'
import '../globals.css'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getDictionary } from '@/get-dictionary'
import { TripGenieLogo } from '@/components/brand/trip-genie-logo'
import Link from 'next/link'

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export const metadata: Metadata = {
  title: 'Trip Genie',
  description: 'Your intelligent, personalized travel planner.',
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: Locale }> // ✅ mark as Promise (important!)
}>) {
  // ✅ Await params first (fixes your error)
  const { lang } = await params

  // ✅ Fetch dictionary after resolving lang
  const dictionary = await getDictionary(lang)

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="w-full border-b border-border/60 bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/55">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href={`/${lang}`} className="group flex items-center gap-3">
            <TripGenieLogo withWordmark title="TripGenie" />
            <span className="sr-only">Go to home</span>
          </Link>
          <div className="flex items-center gap-3">
            <LocaleSwitcher dictionary={dictionary} />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="min-h-[calc(100dvh-160px)]">{children}</main>

      {/* Footer */}
      <footer className="w-full border-t border-border/60 bg-card/40">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-foreground/70 md:flex-row">
          <p>© {new Date().getFullYear()} Trip Genie. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-primary" />
            <span>Crafted for delightful journeys</span>
          </p>
        </div>
      </footer>

    </div>
  )
}
