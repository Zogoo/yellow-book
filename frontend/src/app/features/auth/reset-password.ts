import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="mx-auto max-w-md py-16">
      <div class="yb-card p-8">
        <h1 class="text-2xl font-bold text-[#212121]">Choose a new password</h1>
        <p class="mt-1 mb-6 text-sm text-gray-600">
          At least 12 characters with upper and lower case letters, a number and a symbol.
        </p>
        @if (!token) {
          <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            This reset link is missing its token. Request a new one from the
            <a routerLink="/auth/forgot-password" class="underline">forgot password</a> page.
          </p>
        } @else {
          <form class="space-y-4" (ngSubmit)="submit()" novalidate>
            <input
              class="yb-input"
              type="password"
              name="password"
              placeholder="New password"
              [(ngModel)]="password"
              required
              aria-label="New password"
            />
            <input
              class="yb-input"
              type="password"
              name="confirm"
              placeholder="Confirm new password"
              [(ngModel)]="confirm"
              required
              aria-label="Confirm new password"
            />
            @if (error()) {
              <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
            }
            <button
              type="submit"
              class="yb-btn yb-btn-gold w-full"
              data-testid="reset-password-submit"
              [disabled]="busy()"
            >
              {{ busy() ? 'Updating...' : 'Update password' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  password = '';
  confirm = '';
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.error.set(null);
    if (this.password !== this.confirm) {
      this.error.set('Passwords do not match');
      return;
    }
    this.busy.set(true);
    try {
      await this.auth.resetPassword(this.token, this.password);
      this.toast.success('Password updated. Please sign in.');
      await this.router.navigateByUrl('/auth/login');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to reset password');
    } finally {
      this.busy.set(false);
    }
  }
}
