import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-frequent-faq',
  template: `
    <section class="space-y-3">
      <h2 class="mb-4 text-2xl font-bold text-[#212121]">Frequently Asked Questions</h2>
      @for (item of items; track item.q; let i = $index) {
        <div class="rounded-2xl bg-[#feecb2]">
          <button
            type="button"
            class="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-[#212121]"
            [attr.aria-expanded]="open() === i"
            (click)="toggle(i)"
          >
            {{ item.q }}
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm transition"
              [class.rotate-180]="open() === i"
              >⌄</span
            >
          </button>
          @if (open() === i) {
            <p class="px-5 pb-5 text-sm text-[#424242]">{{ item.a }}</p>
          }
        </div>
      }
    </section>
  `,
})
export class FrequentFaq {
  readonly open = signal<number | null>(0);
  readonly items = [
    {
      q: 'What is Yellow Book?',
      a: 'Yellow Book is a platform where users can discover, review, and connect with companies from different categories such as travel agencies, restaurants, and more.',
    },
    {
      q: 'How can I register my company?',
      a: 'You can register your company by navigating to the "Register" section, filling out the company profile form, and submitting it for verification by our team.',
    },
    {
      q: 'Are all companies verified?',
      a: 'We have a multi-step verification process that includes checking legal documents and contact information before a company is listed as verified.',
    },
    {
      q: 'How do reviews work?',
      a: 'Users can submit reviews for companies they have interacted with. Reviews are moderated for fairness and relevance before being published. Companies can respond to reviews directly.',
    },
  ];

  toggle(index: number): void {
    this.open.set(this.open() === index ? null : index);
  }
}
