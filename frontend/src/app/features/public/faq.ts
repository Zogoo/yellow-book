import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { FrequentFaq } from './frequent-faq';

@Component({
  selector: 'app-faq-page',
  imports: [FrequentFaq, TranslatePipe],
  template: `
    <section class="mx-auto max-w-4xl px-4 py-12">
      <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
        {{ 'nav.faq' | translate }}
      </p>
      <h1 class="mt-2 text-3xl font-bold text-[#212121]">{{ 'home.faqTitle' | translate }}</h1>
      <p class="mt-2 mb-8 text-gray-600">{{ 'faq.lead' | translate }}</p>
      <app-frequent-faq heading="" />
    </section>
  `,
})
export class FaqPage {}
