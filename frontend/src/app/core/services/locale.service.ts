import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLocale = 'mn' | 'en';

const STORAGE_KEY = 'locale';

/**
 * Mongolian is the default: this is a Mongolian service. Only a stored choice
 * overrides it — the browser language is a poor signal here, because a large
 * share of Mongolian users run English-language Windows and Chrome.
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);
  readonly locale = signal<AppLocale>('mn');
  readonly available: { code: AppLocale; label: string; short: string }[] = [
    { code: 'mn', label: 'Монгол', short: 'МН' },
    { code: 'en', label: 'English', short: 'EN' },
  ];

  init(): void {
    this.use(this.preferred());
  }

  use(locale: AppLocale): void {
    this.locale.set(locale);
    this.translate.use(locale);
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // A blocked storage must not stop the language from switching.
    }
    document.documentElement.lang = locale;
  }

  toggle(): void {
    this.use(this.locale() === 'mn' ? 'en' : 'mn');
  }

  private preferred(): AppLocale {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'mn' || stored === 'en') return stored;
    } catch {
      // A blocked storage just means we fall back to the default.
    }
    return 'mn';
  }
}
