import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { resolvePostLoginRedirect, resolveUserRole } from '../../core/utils/role-access';
import { PasswordLoginForm } from '../../shared/password-login-form';

/** `/auth/company/login` — company owners sign in with email/password. */
@Component({
  selector: 'app-company-login-page',
  imports: [RouterLink, PasswordLoginForm],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-[#fff9e6] px-4 py-12 font-jakarta">
      <div class="yb-card w-full max-w-md p-8">
        <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
          Company portal
        </p>
        <h1 class="mt-2 text-2xl font-bold text-[#212121]">Company sign in</h1>
        <p class="mt-1 mb-6 text-sm text-gray-600">
          Sign in with social login or your company email/password to manage your business profile
          and replies.
        </p>
        @if (accessError()) {
          <p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {{ accessError() }}
          </p>
        }
        <button
          type="button"
          class="yb-btn mb-4 w-full border border-gray-200 bg-white"
          [disabled]="socialLoading()"
          (click)="social()"
        >
          {{ socialLoading() ? 'Redirecting...' : 'Continue with Google' }}
        </button>
        <app-password-login-form idPrefix="company-login" (authenticated)="onAuthenticated()" />
        <ul class="mt-6 space-y-1 text-sm text-gray-600">
          <li><a routerLink="/" class="text-[#1877f2]">Return home</a></li>
          <li>
            Need a company account?
            <a routerLink="/auth/register" class="text-[#1877f2]">Register</a>
          </li>
          <li>
            Customer account? <a routerLink="/auth/login" class="text-[#1877f2]">User sign in</a>
          </li>
          <li>
            Admin or sub-admin?
            <a routerLink="/auth/staff/login" class="text-[#1877f2]">Staff sign in</a>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class CompanyLoginPage {
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly accessError = signal<string | null>(null);
  readonly socialLoading = signal(false);

  async onAuthenticated(): Promise<void> {
    const user = this.auth.user();
    if (resolveUserRole(user) !== 'company') {
      this.accessError.set('This sign-in page is for company owner accounts only.');
      this.auth.clearSession();
      return;
    }
    await this.router.navigateByUrl(
      resolvePostLoginRedirect(
        user,
        this.route.snapshot.queryParamMap.get('next'),
        '/company/dashboard',
      ),
    );
  }

  async social(): Promise<void> {
    this.socialLoading.set(true);
    try {
      await this.auth.startOauthLogin('google', {
        intent: 'login',
        next: this.route.snapshot.queryParamMap.get('next') ?? '/company/dashboard',
      });
    } catch {
      this.toast.alert('Unable to continue with social login');
    } finally {
      this.socialLoading.set(false);
    }
  }
}
