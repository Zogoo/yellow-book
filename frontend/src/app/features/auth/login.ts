import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { resolvePostLoginRedirect, resolveUserRole } from '../../core/utils/role-access';
import { AuthUserSummary } from '../../shared/auth-user-summary';
import { EmailCodeLoginForm } from '../../shared/email-code-login-form';

/** `/auth/login` — customer sign-in via Google or a one-time email code. */
@Component({
  selector: 'app-login-page',
  imports: [RouterLink, EmailCodeLoginForm, AuthUserSummary],
  template: `
    <div class="min-h-screen bg-[#fff9e6] font-jakarta">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <a routerLink="/"><img src="/logo/logo.png" alt="Yellow Book" width="140" height="34" /></a>
        <a routerLink="/" class="yb-btn yb-btn-outline">Back to Home</a>
      </div>
      <div class="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-2">
        <section class="rounded-3xl bg-[#fef4d2] p-8">
          <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
            Welcome back
          </p>
          <h1 class="mt-2 text-3xl font-bold text-[#212121]">Sign in with your preferred method</h1>
          <p class="mt-3 text-gray-600">
            Join trusted travelers and agencies who rely on Yellow.Book to manage their presence.
          </p>
          <button
            type="button"
            class="yb-btn mt-6 w-full border border-gray-200 bg-white"
            [disabled]="socialLoading()"
            (click)="social('google')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4-3.2 0-5.8-2.65-5.8-5.9s2.6-5.9 5.8-5.9c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.7 4.05 14.55 3 12 3 7.05 3 3 7.05 3 12s4.05 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-.9-.3-1.1z"
              />
            </svg>
            {{ socialLoading() ? 'Redirecting...' : 'Login with Google' }}
          </button>
          <ul class="mt-6 space-y-2 text-sm text-gray-600">
            <li>
              Need an agency account?
              <a routerLink="/auth/register" class="font-semibold text-[#1877f2]"
                >Register your business</a
              >
            </li>
            <li>
              Company owner?
              <a routerLink="/auth/company/login" class="font-semibold text-[#1877f2]"
                >Company sign in</a
              >
            </li>
            <li>
              Admin or sub-admin?
              <a routerLink="/auth/staff/login" class="font-semibold text-[#1877f2]"
                >Staff sign in</a
              >
            </li>
            <li>
              Prefer browsing?
              <a routerLink="/" class="font-semibold text-[#1877f2]">Return home</a>
            </li>
          </ul>
        </section>
        <section class="yb-card p-8">
          <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
            Secure access
          </p>
          <h2 class="mt-2 text-2xl font-bold text-[#212121]">Email code login</h2>
          <p class="mt-1 mb-6 text-gray-600">Use a one-time passcode delivered to your inbox.</p>
          @if (auth.isAuthenticated()) {
            <app-auth-user-summary />
          } @else {
            <app-email-code-login-form (authenticated)="onAuthenticated()" />
          }
          <p class="mt-6 text-sm text-gray-500">
            Trouble signing in?
            <a routerLink="/auth/forgot-password" class="font-semibold text-[#1877f2]"
              >Reset access</a
            >
          </p>
        </section>
      </div>
    </div>
  `,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly socialLoading = signal(false);

  constructor() {
    inject(Title).setTitle('Sign in • Yellow Book');
  }

  async onAuthenticated(): Promise<void> {
    const user = this.auth.user();
    const role = resolveUserRole(user);
    if (role !== 'user') {
      this.auth.clearSession();
      await this.router.navigateByUrl(
        role === 'company' ? '/auth/company/login' : '/auth/staff/login',
      );
      return;
    }
    this.toast.success('Signed in successfully');
    await this.router.navigateByUrl(
      resolvePostLoginRedirect(
        user,
        this.route.snapshot.queryParamMap.get('next'),
        '/user/dashboard',
      ),
    );
  }

  async social(provider: string): Promise<void> {
    this.socialLoading.set(true);
    try {
      await this.auth.startOauthLogin(provider, {
        intent: 'login',
        next: this.route.snapshot.queryParamMap.get('next') ?? '',
      });
    } catch {
      this.toast.alert('Unable to continue with social login');
    } finally {
      this.socialLoading.set(false);
    }
  }
}
