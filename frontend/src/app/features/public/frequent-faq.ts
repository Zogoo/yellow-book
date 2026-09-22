import { Component, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-frequent-faq',
  imports: [TranslatePipe],
  template: `
    <section class="space-y-3">
      @if (heading()) {
        <h2 class="mb-4 text-2xl font-bold text-[#212121]">{{ heading() }}</h2>
      }
      @for (item of items; track item.q; let i = $index) {
        <div class="rounded-2xl bg-[#feecb2]">
          <button
            type="button"
            class="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-[#212121]"
            [attr.aria-expanded]="open() === i"
            (click)="toggle(i)"
          >
            {{ item.q | translate }}
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm transition"
              [class.rotate-180]="open() === i"
              >⌄</span
            >
          </button>
          @if (open() === i) {
            <p class="px-5 pb-5 text-sm text-[#424242]">{{ item.a | translate }}</p>
          }
        </div>
      }
    </section>
  `,
})
export class FrequentFaq {
  readonly heading = input('Frequently Asked Questions');
  readonly open = signal<number | null>(0);
  // Four questions, in whichever language the reader picked.
  readonly items = [
    { q: 'faq.q1', a: 'faq.a1' },
    { q: 'faq.q2', a: 'faq.a2' },
    { q: 'faq.q3', a: 'faq.a3' },
    { q: 'faq.q4', a: 'faq.a4' },
  ];

  toggle(index: number): void {
    this.open.set(this.open() === index ? null : index);
  }
}
