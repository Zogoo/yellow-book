import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="mx-auto max-w-md py-16">
      <div class="yb-card p-8">
        <h1 class="text-2xl font-bold text-[#212121]">Forgot your password?</h1>
        <p class="mt-1 mb-6 text-sm text-gray-600">
          Enter the email on your account and we'll send a reset link.
        </p>
        @if (sent()) {
          <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            If an account exists for {{ email }}, a reset link is on its way. Check your inbox.
          </p>
        } @else {
          <form class="space-y-4" (ngSubmit)="submit()" novalidate>
            <input
              class="yb-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              [(ngModel)]="email"
              required
              aria-label="Email"
            />
            <button type="submit" class="yb-btn yb-btn-gold w-full" [disabled]="busy()">
              {{ busy() ? 'Sending...' : 'Send reset link' }}
            </button>
          </form>
        }
        <p class="mt-6 text-sm text-gray-500">
          <a routerLink="/auth/login" class="text-[#1877f2]">Back to sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  email = '';
  readonly busy = signal(false);
  readonly sent = signal(false);

  async submit(): Promise<void> {
    if (!this.email.trim()) {
      this.toast.alert('Email is required');
      return;
    }
    this.busy.set(true);
    try {
      await this.auth.forgotPassword(this.email);
      this.sent.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
