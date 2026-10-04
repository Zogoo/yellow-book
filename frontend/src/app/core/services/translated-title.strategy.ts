import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/**
 * Route `title` values are i18n keys. Renders "<page> • Yellow Book" in the current
 * language and re-renders on a language switch. Routes without a title get the brand
 * only; pages with data-driven titles (a company profile) set their own afterwards.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private lastKey: string | undefined;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => {
      if (this.lastKey) this.apply(this.lastKey);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastKey = this.buildTitle(snapshot);
    this.apply(this.lastKey);
  }

  private apply(key: string | undefined): void {
    this.title.setTitle(key ? `${this.translate.instant(key)} • Yellow Book` : 'Yellow Book');
  }
}
