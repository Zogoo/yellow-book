import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 class="text-4xl font-bold text-[#212121]">{{ 'common.pageNotFound' | translate }}</h1>
      <p class="text-gray-500">{{ 'common.pageNotFoundLead' | translate }}</p>
      <a routerLink="/" class="yb-btn yb-btn-gold">{{ 'common.returnHome' | translate }}</a>
    </section>
  `,
})
export class NotFoundPage {}
