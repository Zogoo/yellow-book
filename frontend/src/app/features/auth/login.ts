import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { resolvePostLoginRedirect } from '../../core/utils/role-access';
import { AuthUserSummary } from '../../shared/auth-user-summary';
import { SignInFlow } from '../../shared/sign-in-flow';

/**
 * `/auth/login` and `/auth/signup` — one page, one flow, every role.
 * Where you land afterwards is decided by the account, never by a tab.
 */
@Component({
  selector: 'app-login-page',
  imports: [RouterLink, SignInFlow, AuthUserSummary, TranslatePipe],
  template: `
    <div class="min-h-screen bg-[#fff9e6] font-jakarta">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <a routerLink="/"><img src="/logo/logo.png" alt="Yellow Book" width="140" height="34" /></a>
        <a routerLink="/" class="yb-btn yb-btn-outline">{{ 'auth.backToHome' | translate }}</a>
      </div>
      <div class="mx-auto grid max-w-5xl gap-6 px-4 pb-16 md:grid-cols-[1fr_420px]">
        <section class="rounded-3xl bg-[#fef4d2] p-8">
          <p class="text-xs font-semibold tracking-[0.35em] text-[#a67c00] uppercase">
            {{ (signUp() ? 'auth.joinYellowBook' : 'auth.welcome') | translate }}
          </p>
          <h1 class="mt-2 text-3xl font-bold text-[#212121]">
            {{ (signUp() ? 'auth.createAccount' : 'auth.signIn') | translate }}
          </h1>
          <p class="mt-3 text-gray-600">{{ 'auth.lead' | translate }}</p>
          <ul class="mt-6 space-y-3 text-sm text-gray-700">
            <li class="flex gap-2">
              <span aria-hidden="true">✓</span> {{ 'auth.benefit1' | translate }}
            </li>
            <li class="flex gap-2">
              <span aria-hidden="true">✓</span> {{ 'auth.benefit2' | translate }}
            </li>
            <li class="flex gap-2">
              <span aria-hidden="true">✓</span> {{ 'auth.benefit3' | translate }}
            </li>
          </ul>
          <p class="mt-8 text-sm text-gray-600">
            {{ 'auth.runningBusiness' | translate }}
            <a routerLink="/business/signup" class="font-semibold text-[#1877f2]">{{
              'auth.listYourBusiness' | translate
            }}</a>
          </p>
        </section>

        <section class="yb-card p-8">
          @if (auth.isAuthenticated()) {
            <app-auth-user-summary />
          } @else {
            <app-sign-in-flow
              [intro]="intro()"
              [startInSignUp]="signUp()"
              [nextPath]="nextPath()"
              (authenticated)="onAuthenticated()"
            />
            <p class="mt-6 text-sm text-gray-500">
              @if (signUp()) {
                {{ 'auth.alreadyHaveAccount' | translate }}
                <a routerLink="/auth/login" class="font-semibold text-[#1877f2]">Sign in</a>
              } @else {
                {{ 'auth.newToYellowBook' | translate }}
                <a routerLink="/auth/signup" class="font-semibold text-[#1877f2]">{{
                  'footer.createAccount' | translate
                }}</a>
              }
            </p>
          }
        </section>
      </div>
    </div>
  `,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly signUp = signal(false);
  readonly intro = signal('');
  readonly nextPath = signal('');
  private handled = false;

  constructor() {
    inject(Title).setTitle(`${this.translate.instant('nav.logIn')} • Yellow Book`);
    this.signUp.set(this.route.snapshot.data['mode'] === 'signup');
    this.nextPath.set(this.route.snapshot.queryParamMap.get('next') ?? '');
    this.intro.set(this.route.snapshot.queryParamMap.get('reason') ?? '');
    effect(() => {
      if (this.auth.isAuthenticated() && this.auth.user()) void this.onAuthenticated();
    });
  }

  async onAuthenticated(): Promise<void> {
    if (this.handled) return;
    this.handled = true;
    const user = this.auth.user();
    this.toast.success(
      this.translate.instant('auth.signedInAs', { name: user?.name || user?.email }),
    );
    await this.router.navigateByUrl(resolvePostLoginRedirect(user, this.nextPath()));
  }
}
