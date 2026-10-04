import { Injectable, Injector, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/**
 * Route `title` values are i18n keys. Renders "<page> • Yellow Book" in the current
 * language and re-renders on a language switch. Routes without a title get the brand
 * only; pages with data-driven titles (a company profile) set their own afterwards.
 *
 * TranslateService is resolved lazily: the Router creates this strategy, AuthService
 * injects the Router, and translations load through the HTTP interceptor that needs
 * AuthService — an eager inject here is a circular dependency (NG0200).
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private translate: TranslateService | null = null;
  private lastKey: string | undefined;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastKey = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    const translate = this.translations();
    const key = this.lastKey;
    this.title.setTitle(key ? `${translate.instant(key)} • Yellow Book` : 'Yellow Book');
  }

  private translations(): TranslateService {
    if (!this.translate) {
      this.translate = this.injector.get(TranslateService);
      this.translate.onLangChange.subscribe(() => this.apply());
    }
    return this.translate;
  }
}
