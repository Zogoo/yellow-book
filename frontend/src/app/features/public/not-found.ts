import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 class="text-4xl font-bold text-[#212121]">Page not found</h1>
      <p class="text-gray-500">The page you are looking for does not exist.</p>
      <a routerLink="/" class="yb-btn yb-btn-gold">Return home</a>
    </section>
  `,
})
export class NotFoundPage {}
