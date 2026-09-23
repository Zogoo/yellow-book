import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-about-page',
  imports: [TranslatePipe],
  template: `
    <section class="mx-auto max-w-3xl py-12">
      <h1 class="mb-4 text-3xl font-bold text-[#212121]">{{ 'about.title' | translate }}</h1>
      <p class="text-gray-600">{{ 'about.lead' | translate }}</p>
    </section>
  `,
})
export class AboutPage {
  constructor() {
    inject(Title).setTitle(`${inject(TranslateService).instant('about.title')} • Yellow Book`);
  }
}
