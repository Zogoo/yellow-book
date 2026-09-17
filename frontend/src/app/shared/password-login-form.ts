import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../core/services/auth.service';
import { AuthUser } from '../core/models';

/** Email + password form shared by the company and staff sign-in pages. */
@Component({
  selector: 'app-password-login-form',
  imports: [FormsModule],
  template: `
    <form class="space-y-4" (ngSubmit)="submit()" novalidate>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700" [for]="idPrefix() + '-email'"
          >Email</label
        >
        <input
          [id]="idPrefix() + '-email'"
          class="yb-input"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="name@company.com"
          [(ngModel)]="email"
          [disabled]="busy()"
          required
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700" [for]="idPrefix() + '-password'"
          >Password</label
        >
        <div class="relative">
          <input
            [id]="idPrefix() + '-password'"
            class="yb-input pr-12"
            [type]="show() ? 'text' : 'password'"
            name="password"
            autocomplete="current-password"
            placeholder="••••••••••••"
            [(ngModel)]="password"
            [disabled]="busy()"
            required
          />
          <button
            type="button"
            class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-500"
            (click)="show.set(!show())"
            [attr.aria-label]="show() ? 'Hide password' : 'Show password'"
          >
            {{ show() ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>
      @if (error()) {
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {{ error() }}
        </p>
      }
      <button type="submit" class="yb-btn yb-btn-gold w-full" [disabled]="busy()">
        {{ busy() ? 'Signing in...' : submitLabel() }}
      </button>
    </form>
  `,
})
export class PasswordLoginForm {
  private readonly auth = inject(AuthService);
  readonly idPrefix = input('login');
  readonly submitLabel = input('Sign in');
  readonly authenticated = output<AuthUser>();
  email = '';
  password = '';
  readonly busy = signal(false);
  readonly show = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.error.set(null);
    if (!this.email.trim() || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.auth.login({ email: this.email, password: this.password });
      this.authenticated.emit(result.user);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      this.busy.set(false);
    }
  }
}
