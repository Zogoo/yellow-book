import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [RouterLink, FormsModule, TranslatePipe],
  template: `
    <div class="mx-auto max-w-md py-16">
      <div class="yb-card p-8">
        <h1 class="text-2xl font-bold text-[#212121]">{{ 'auth.forgotTitle' | translate }}</h1>
        <p class="mt-1 mb-6 text-sm text-gray-600">
          {{ 'auth.forgotLead' | translate }}
        </p>
        @if (sent()) {
          <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {{ 'auth.resetLinkSent' | translate: { email: email } }}
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
              [attr.aria-label]="'common.email' | translate"
            />
            <button type="submit" class="yb-btn yb-btn-gold w-full" [disabled]="busy()">
              {{ busy() ? ('auth.sending' | translate) : ('auth.sendResetLink' | translate) }}
            </button>
          </form>
        }
        <p class="mt-6 text-sm text-gray-500">
          <a routerLink="/auth/login" class="text-[#1877f2]">{{
            'auth.backToSignIn' | translate
          }}</a>
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
