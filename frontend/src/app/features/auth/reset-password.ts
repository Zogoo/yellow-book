import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [RouterLink, FormsModule, TranslatePipe],
  template: `
    <div class="mx-auto max-w-md py-16">
      <div class="yb-card p-8">
        <h1 class="text-2xl font-bold text-[#212121]">{{ 'auth.resetTitle' | translate }}</h1>
        <p class="mt-1 mb-6 text-sm text-gray-600">
          {{ 'auth.resetLead' | translate }}
        </p>
        @if (!token) {
          <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ 'auth.missingToken' | translate }}
            <a routerLink="/auth/forgot-password" class="underline">{{
              'auth.requestNewLink' | translate
            }}</a
            >.
          </p>
        } @else {
          <form class="space-y-4" (ngSubmit)="submit()" novalidate>
            <input
              class="yb-input"
              type="password"
              name="password"
              [attr.placeholder]="'auth.newPassword' | translate"
              [(ngModel)]="password"
              required
              [attr.aria-label]="'auth.newPassword' | translate"
            />
            <input
              class="yb-input"
              type="password"
              name="confirm"
              [attr.placeholder]="'auth.confirmNewPassword' | translate"
              [(ngModel)]="confirm"
              required
              [attr.aria-label]="'auth.confirmNewPassword' | translate"
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
              {{ busy() ? ('common.pleaseWait' | translate) : ('auth.updatePassword' | translate) }}
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
      // A reset link may be opened while another account is signed in here;
      // drop that session so the person lands on the login page.
      this.auth.clearSession();
      this.toast.success('Password updated. Please sign in.');
      await this.router.navigateByUrl('/auth/login');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to reset password');
    } finally {
      this.busy.set(false);
    }
  }
}
