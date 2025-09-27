export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'hi', 'fr', 'de', 'ar', 'zh'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
