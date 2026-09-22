import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { LoginModalService } from '../core/services/login-modal.service';
import { resolvePostLoginRedirect } from '../core/utils/role-access';
import { AuthUserSummary } from './auth-user-summary';
import { SignInFlow } from './sign-in-flow';

/** The same front door as the sign-in page, in a dialog. No role chooser. */
@Component({
  selector: 'app-login-modal',
  imports: [SignInFlow, AuthUserSummary, RouterLink],
  template: `
    @if (modal.open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        (click)="modal.closeModal()"
        (keydown.escape)="modal.closeModal()"
      >
        <div
          class="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-in-modal-title"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 id="sign-in-modal-title" class="text-lg font-bold text-gray-900">
                Sign in or create an account
              </h2>
              <p class="text-sm text-gray-500">One account for customers and businesses.</p>
            </div>
            <button
              type="button"
              class="text-gray-500"
              aria-label="Close"
              (click)="modal.closeModal()"
            >
              ✕
            </button>
          </div>
          <div class="px-6 py-5">
            @if (auth.isAuthenticated()) {
              <app-auth-user-summary />
            } @else {
              <app-sign-in-flow [intro]="modal.reason()" (authenticated)="onAuthenticated()" />
            }
            <p class="mt-5 text-center text-xs text-gray-500">
              Running a business?
              <a
                routerLink="/business/signup"
                class="font-semibold text-[#1877f2]"
                (click)="modal.closeModal()"
              >
                List your business
              </a>
            </p>
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
  private handled = false;

  constructor() {
    effect(() => {
      if (this.modal.open() && this.auth.isAuthenticated() && this.auth.user())
        this.onAuthenticated();
    });
    effect(() => {
      document.body.classList.toggle('scroll-locked', this.modal.open());
    });
  }

  onAuthenticated(): void {
    if (this.handled) return;
    this.handled = true;
    const redirect = this.modal.redirectOnSuccess();
    this.modal.closeModal();
    this.handled = false;
    if (redirect)
      void this.router.navigateByUrl(resolvePostLoginRedirect(this.auth.user(), '', redirect));
  }
}
