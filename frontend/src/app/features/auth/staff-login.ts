import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { resolvePostLoginRedirect, resolveUserRole } from '../../core/utils/role-access';
import { PasswordLoginForm } from '../../shared/password-login-form';

/** `/auth/staff/login` — admins and agents. */
@Component({
  selector: 'app-staff-login-page',
  imports: [RouterLink, PasswordLoginForm],
  template: `
    <div
      class="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 px-4 py-12 font-jakarta"
    >
      <div class="yb-card w-full max-w-md p-8">
        <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">Staff portal</p>
        <h1 class="mt-2 text-2xl font-bold text-[#212121]">Admin &amp; sub-admin sign in</h1>
        <p class="mt-1 mb-6 text-sm text-gray-600">
          Use your work email and password to access admin or agent dashboards.
        </p>
        @if (accessError()) {
          <p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {{ accessError() }}
          </p>
        }
        <app-password-login-form idPrefix="staff-login" (authenticated)="onAuthenticated()" />
        <ul class="mt-6 space-y-1 text-sm text-gray-600">
          <li><a routerLink="/" class="text-[#1877f2]">Return home</a></li>
          <li>
            Customer account? <a routerLink="/auth/login" class="text-[#1877f2]">User sign in</a>
          </li>
          <li>
            Company owner?
            <a routerLink="/auth/company/login" class="text-[#1877f2]">Company sign in</a>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class StaffLoginPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly accessError = signal<string | null>(null);

  async onAuthenticated(): Promise<void> {
    const user = this.auth.user();
    const role = resolveUserRole(user);
    if (role !== 'admin' && role !== 'agent') {
      this.accessError.set('This sign-in page is for admin and sub-admin accounts only.');
      this.auth.clearSession();
      return;
    }
    const fallback = role === 'agent' ? '/agent/dashboard' : '/admin/dashboard';
    await this.router.navigateByUrl(
      resolvePostLoginRedirect(user, this.route.snapshot.queryParamMap.get('next'), fallback),
    );
  }
}
