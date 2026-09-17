import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-about-page',
  template: `
    <section class="mx-auto max-w-3xl py-12">
      <h1 class="mb-4 text-3xl font-bold text-[#212121]">About Us</h1>
      <p class="text-gray-600">
        Welcome to Yellow Book Tourism! We connect travelers with trusted companies and provide
        reviews to help you make the best choices for your next journey.
      </p>
    </section>
  `,
})
export class AboutPage {
  constructor() {
    inject(Title).setTitle('About Us - Yellow Book');
  }
}
