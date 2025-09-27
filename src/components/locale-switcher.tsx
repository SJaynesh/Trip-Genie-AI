'use client';

import { usePathname } from 'next/navigation';
import { i18n } from '../i18n-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';

const languageLabels: Record<string, string> = {
  en: 'English',
  es: 'Español',
  hi: 'हिन्दी',
  fr: 'Français',
  de: 'Deutsch',
  ar: 'العربية',
  zh: '中文',
};

export function LocaleSwitcher({ dictionary }: { dictionary: any }) {
  const pathname = usePathname();

  const getLocaleFromPath = () => {
    const segments = pathname.split('/');
    return segments[1];
  };

  const redirectedPathName = (locale: string) => {
    if (!pathname) return '/';
    const segments = pathname.split('/');
    segments[1] = locale;
    return segments.join('/');
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="language-select">{dictionary.localeSwitcher.label}</Label>
      <Select
        defaultValue={getLocaleFromPath()}
        onValueChange={(locale) => {
          window.location.href = redirectedPathName(locale);
        }}
        
      >
        <SelectTrigger className="w-[160px]" id="language-select">
          <SelectValue placeholder={dictionary.localeSwitcher.label} />
        </SelectTrigger>
        <SelectContent>
          {i18n.locales.map((locale) => {
            return (
              <SelectItem key={locale} value={locale}>
                {languageLabels[locale] ?? locale.toUpperCase()}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
