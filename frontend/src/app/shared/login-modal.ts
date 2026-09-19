import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { LoginModalService } from '../core/services/login-modal.service';
import { ToastService } from '../core/services/toast.service';
import { resolvePostLoginRedirect } from '../core/utils/role-access';
import { AuthUserSummary } from './auth-user-summary';
import { EmailCodeLoginForm } from './email-code-login-form';

/** Global "Choose your role" dialog with social buttons and the email-code form. */
@Component({
  selector: 'app-login-modal',
  imports: [EmailCodeLoginForm, AuthUserSummary],
  template: `
    @if (modal.open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        (click)="modal.closeModal()"
      >
        <div
          class="max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Choose your role"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 class="text-lg font-bold text-gray-900">Choose your role</h2>
            <button
              type="button"
              class="text-gray-500"
              aria-label="Close"
              (click)="modal.closeModal()"
            >
              ✕
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3 px-6 pt-4">
            <button
              type="button"
              class="rounded-xl border-2 border-[#fcc207] bg-[#fff9e6] px-4 py-3 text-sm font-semibold"
            >
              👤 User Login
            </button>
            <button
              type="button"
              class="rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold hover:border-[#fcc207]"
              (click)="businessLogin()"
            >
              🏢 Business Login
            </button>
          </div>
          <div class="px-6 py-5">
            <h3 class="text-xl font-bold text-gray-900">User Login</h3>
            <p class="mb-4 text-sm text-gray-500">
              Sign in quickly using your preferred social account or a one-time email code.
            </p>
            <div class="space-y-2">
              @for (provider of providers; track provider.key) {
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dbe7ff] bg-[#f6fafd] px-4 py-2.5 text-sm font-medium"
                  [disabled]="loading() !== null"
                  (click)="social(provider.key)"
                >
                  {{
                    loading() === provider.key ? 'Redirecting...' : 'Log in with ' + provider.label
                  }}
                </button>
              }
            </div>
            <div class="my-4 flex items-center gap-3 text-xs text-gray-400">
              <span class="h-px flex-1 bg-gray-200"></span>OR<span
                class="h-px flex-1 bg-gray-200"
              ></span>
            </div>
            <h4 class="mb-2 text-sm font-semibold text-gray-700">Email Code Login</h4>
            @if (auth.isAuthenticated()) {
              <app-auth-user-summary />
            } @else {
              @if (formKey(); as key) {
                <app-email-code-login-form (authenticated)="onAuthenticated()" />
              }
            }
            <div class="mt-4 flex justify-center gap-4 text-xs text-gray-400">
              <span>Terms &amp; Conditions</span>
              <span>Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class LoginModal {
  readonly modal = inject(LoginModalService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly loading = signal<string | null>(null);
  private handled = false;
  readonly formKey = signal(1);
  readonly providers = [
    { key: 'google', label: 'Google' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'apple', label: 'Apple' },
  ];

  constructor() {
    effect(() => {
      if (!this.modal.open()) this.formKey.update((k) => k + 1);
    });
    effect(() => {
      // Same reason as the login page: the form is removed as soon as the
      // session exists, so the redirect is driven by the session.
      if (this.modal.open() && this.auth.isAuthenticated() && this.auth.user()) {
        this.onAuthenticated();
      }
    });
    effect(() => {
      document.body.classList.toggle('scroll-locked', this.modal.open());
    });
  }

  businessLogin(): void {
    this.modal.closeModal();
    void this.router.navigateByUrl('/auth/company/login');
  }

  async social(provider: string): Promise<void> {
    this.loading.set(provider);
    try {
      await this.auth.startOauthLogin(provider, { intent: 'login', next: this.nextParam() });
    } catch {
      this.toast.alert('Unable to continue with social login');
    } finally {
      this.loading.set(null);
    }
  }

  onAuthenticated(): void {
    if (this.handled) return;
    this.handled = true;
    const target = resolvePostLoginRedirect(this.auth.user(), this.nextParam(), '/user/dashboard');
    this.modal.closeModal();
    void this.router.navigateByUrl(target);
  }

  private nextParam(): string {
    return new URLSearchParams(window.location.search).get('next') ?? '';
  }
}
