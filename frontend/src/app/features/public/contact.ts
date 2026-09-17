import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-contact-page',
  template: `
    <section class="mx-auto max-w-xl py-12">
      <h1 class="mb-6 text-3xl font-bold text-[#212121]">Contact Us</h1>
      <form class="space-y-4" (submit)="$event.preventDefault()">
        <input class="yb-input" type="text" placeholder="Your Name" aria-label="Your Name" />
        <input class="yb-input" type="email" placeholder="Your Email" aria-label="Your Email" />
        <textarea
          class="yb-input"
          rows="5"
          placeholder="Your Message"
          aria-label="Your Message"
        ></textarea>
        <button type="submit" class="yb-btn bg-blue-600 text-white">Send</button>
      </form>
    </section>
  `,
})
export class ContactPage {
  constructor() {
    inject(Title).setTitle('Contact Us - Yellow Book');
  }
}
