import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AppLocale, LocaleService } from '../core/services/locale.service';

/** Mongolian or English, one click, remembered on this device. */
@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  template: `
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-sm font-medium text-[#616161] hover:border-gray-200 hover:text-[#212121]"
        [attr.aria-label]="'nav.language' | translate"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        <span aria-hidden="true">🌐</span>
        <span>{{ current().short }}</span>
      </button>
      @if (open()) {
        <ul
          class="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
          role="menu"
        >
          @for (option of locale.available; track option.code) {
            <li>
              <button
                type="button"
                role="menuitemradio"
                [attr.aria-checked]="option.code === locale.locale()"
                class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                [class.font-semibold]="option.code === locale.locale()"
                (click)="choose(option.code)"
              >
                {{ option.label }}
                @if (option.code === locale.locale()) {
                  <span aria-hidden="true">✓</span>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class LanguageSwitcher {
  readonly locale = inject(LocaleService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly compact = input(false);
  readonly open = signal(false);

  current() {
    return (
      this.locale.available.find((o) => o.code === this.locale.locale()) ?? this.locale.available[0]
    );
  }

  choose(code: AppLocale): void {
    this.locale.use(code);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
