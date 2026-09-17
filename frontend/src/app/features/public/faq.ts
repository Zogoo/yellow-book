import { Component } from '@angular/core';

import { FrequentFaq } from './frequent-faq';

@Component({
  selector: 'app-faq-page',
  imports: [FrequentFaq],
  template: `
    <section class="mx-auto max-w-4xl px-4 py-12">
      <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">Support center</p>
      <h1 class="mt-2 text-3xl font-bold text-[#212121]">Frequently Asked Questions</h1>
      <p class="mt-2 mb-8 text-gray-600">
        Everything you need to know about using Yellow Book. Can't find the answer you're looking
        for? Reach out anytime.
      </p>
      <app-frequent-faq />
    </section>
  `,
})
export class FaqPage {}
