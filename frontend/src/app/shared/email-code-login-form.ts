import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { AuthUser } from '../core/models';

/** Two-step email → 6-digit code sign-in used by the user login page and the modal. */
@Component({
  selector: 'app-email-code-login-form',
  imports: [FormsModule],
  template: `
    <form class="space-y-4" (ngSubmit)="submit()" novalidate>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700" for="email-code-email"
          >Email address</label
        >
        <input
          id="email-code-email"
          class="yb-input"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="you@example.com"
          [(ngModel)]="email"
          [disabled]="step() === 'code' || busy()"
          required
        />
      </div>
      @if (step() === 'code') {
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700" for="email-code-otp"
            >Verification code</label
          >
          <input
            id="email-code-otp"
            class="yb-input tracking-[0.4em]"
            type="text"
            inputmode="numeric"
            name="code"
            maxlength="6"
            placeholder="123456"
            [(ngModel)]="code"
            [disabled]="busy()"
            required
          />
          <p class="mt-1 text-xs text-gray-500">
            We sent a 6-digit code to <strong>{{ email }}</strong
            >.
            @if (debugCode()) {
              <span class="ml-1 rounded bg-amber-100 px-1 text-amber-800"
                >Dev code: {{ debugCode() }}</span
              >
            }
          </p>
        </div>
      }
      @if (error()) {
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {{ error() }}
        </p>
      }
      <button type="submit" class="yb-btn yb-btn-gold w-full" [disabled]="busy()">
        {{ busy() ? 'Please wait...' : step() === 'email' ? 'Send code' : 'Verify & sign in' }}
      </button>
      @if (step() === 'code') {
        <div class="flex justify-between text-xs text-gray-500">
          <button type="button" class="underline" (click)="reset()" [disabled]="busy()">
            Use a different email
          </button>
          <button type="button" class="underline" (click)="resend()" [disabled]="busy()">
            Resend code
          </button>
        </div>
      }
    </form>
  `,
})
export class EmailCodeLoginForm {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly authenticated = output<AuthUser>();
  email = '';
  code = '';
  readonly step = signal<'email' | 'code'>('email');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly debugCode = signal<string | null>(null);

  async submit(): Promise<void> {
    this.error.set(null);
    if (this.step() === 'email') return this.resend();
    if (!/^\d{6}$/.test(this.code.trim())) {
      this.error.set('Enter the 6-digit code from your email.');
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.auth.verifyEmailCode(this.email, this.code.trim());
      this.authenticated.emit(result.user);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to verify the code.');
    } finally {
      this.busy.set(false);
    }
  }

  async resend(): Promise<void> {
    if (!this.email.trim()) {
      this.error.set('Email is required.');
      return;
    }
    this.busy.set(true);
    try {
      const data = await this.auth.requestEmailCode(this.email);
      this.debugCode.set(data?.debug?.code ?? null);
      this.step.set('code');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to send the code.');
      this.toast.alert('Unable to send verification code');
    } finally {
      this.busy.set(false);
    }
  }

  reset(): void {
    this.step.set('email');
    this.code = '';
    this.debugCode.set(null);
    this.auth.clearEmailChallenge();
  }
}
