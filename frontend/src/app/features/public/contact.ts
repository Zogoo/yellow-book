import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

/** `/contact` — reaches a real administrator queue. */
@Component({
  selector: 'app-contact-page',
  imports: [FormsModule, TranslatePipe],
  template: `
    <section class="mx-auto max-w-xl py-12">
      <h1 class="mb-2 text-3xl font-bold text-[#212121]">{{ 'contact.title' | translate }}</h1>
      <p class="mb-6 text-gray-600">{{ 'contact.lead' | translate }}</p>
      @if (sent()) {
        <div class="yb-card p-6" role="status">
          <h2 class="text-lg font-semibold text-emerald-700">
            {{ 'contact.received' | translate }}
          </h2>
          <p class="mt-1 text-sm text-gray-600">
            {{ 'contact.receivedLead' | translate: { name: form.name, email: form.email } }}
          </p>
          <button type="button" class="yb-btn yb-btn-outline mt-4" (click)="again()">
            {{ 'contact.sendAnother' | translate }}
          </button>
        </div>
      } @else {
        <form class="space-y-4" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="mb-1 block text-sm font-medium" for="contact-name">{{
              'contact.yourName' | translate
            }}</label>
            <input
              id="contact-name"
              class="yb-input"
              name="name"
              [(ngModel)]="form.name"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium" for="contact-email">{{
              'contact.yourEmail' | translate
            }}</label>
            <input
              id="contact-email"
              class="yb-input"
              type="email"
              name="email"
              [(ngModel)]="form.email"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium" for="contact-message">{{
              'contact.message' | translate
            }}</label>
            <textarea
              id="contact-message"
              class="yb-input"
              rows="5"
              name="message"
              [attr.placeholder]="'contact.messagePlaceholder' | translate"
              [(ngModel)]="form.message"
              required
            ></textarea>
          </div>
          @if (error()) {
            <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {{ error() }}
            </p>
          }
          <button type="submit" class="yb-btn yb-btn-gold" [disabled]="busy()">
            {{ (busy() ? 'contact.sending' : 'contact.send') | translate }}
          </button>
        </form>
      }
    </section>
  `,
})
export class ContactPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);
  form = {
    name: this.auth.user()?.name ?? '',
    email: this.auth.user()?.email ?? '',
    message: '',
  };

  constructor() {
    inject(Title).setTitle('Contact us - Yellow Book');
  }

  async submit(): Promise<void> {
    this.error.set(null);
    if (!this.form.name.trim()) return this.error.set('Tell us your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim()))
      return this.error.set('Enter an email address we can reply to.');
    if (this.form.message.trim().length < 10)
      return this.error.set('Please describe the problem in a sentence or two.');

    this.busy.set(true);
    try {
      await this.api.postData(
        'support/messages',
        {
          name: this.form.name.trim(),
          email: this.form.email.trim(),
          message: this.form.message.trim(),
        },
        { toast: { showError: false } },
      );
      this.sent.set(true);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'We could not send your message.');
    } finally {
      this.busy.set(false);
    }
  }

  again(): void {
    this.form = { ...this.form, message: '' };
    this.sent.set(false);
  }
}
