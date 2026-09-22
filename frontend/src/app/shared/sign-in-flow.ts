import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { ApiClientError } from '../core/services/api.service';
import { AuthUser } from '../core/models';
import { PASSWORD_RULE_TEXT, passwordProblem } from '../core/utils/password-policy';
import { environment } from '../../environments/environment';

type Step = 'email' | 'code' | 'password' | 'create' | 'create-code';

/**
 * The single front door. It asks for an email and then adapts: an existing
 * account gets a one-time code (or a password), a new one gets an account.
 * The role never has to be chosen — the server decides where you land.
 */
@Component({
  selector: 'app-sign-in-flow',
  imports: [FormsModule, RouterLink],
  template: `
    <form class="space-y-4" (ngSubmit)="submit()" novalidate>
      @if (intro()) {
        <p class="rounded-xl bg-[#fff9e6] px-4 py-3 text-sm text-[#7a5c00]">{{ intro() }}</p>
      }

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700" for="sign-in-email"
          >Email address</label
        >
        <div class="flex gap-2">
          <input
            id="sign-in-email"
            class="yb-input"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
            [(ngModel)]="email"
            [readonly]="step() !== 'email'"
            [class.bg-gray-50]="step() !== 'email'"
            required
          />
          @if (step() !== 'email') {
            <button
              type="button"
              class="yb-btn yb-btn-outline whitespace-nowrap"
              (click)="restart()"
            >
              Change
            </button>
          }
        </div>
      </div>

      @switch (step()) {
        @case ('code') {
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700" for="sign-in-code"
              >6-digit code</label
            >
            <input
              id="sign-in-code"
              class="yb-input tracking-[0.4em]"
              type="text"
              inputmode="numeric"
              name="code"
              maxlength="6"
              placeholder="123456"
              autocomplete="one-time-code"
              [(ngModel)]="code"
              required
            />
            <p class="mt-1 text-xs text-gray-500">
              We emailed a code to <strong>{{ email }}</strong
              >.
              @if (devCode()) {
                <span class="ml-1 rounded bg-amber-100 px-1 text-amber-800"
                  >Dev code: {{ devCode() }}</span
                >
              }
            </p>
          </div>
        }
        @case ('password') {
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700" for="sign-in-password"
              >Password</label
            >
            <input
              id="sign-in-password"
              class="yb-input"
              type="password"
              name="password"
              autocomplete="current-password"
              [(ngModel)]="password"
              required
            />
          </div>
        }
        @case ('create') {
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700" for="sign-up-name"
              >Your name</label
            >
            <input
              id="sign-up-name"
              class="yb-input"
              name="name"
              autocomplete="name"
              placeholder="How you want to appear on your reviews"
              [(ngModel)]="name"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700" for="sign-up-password"
              >Choose a password</label
            >
            <input
              id="sign-up-password"
              class="yb-input"
              type="password"
              name="newPassword"
              autocomplete="new-password"
              [(ngModel)]="password"
              required
            />
            <p class="mt-1 text-xs text-gray-500">{{ ruleText }}</p>
          </div>
        }
        @case ('create-code') {
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700" for="sign-up-name-code"
              >Your name</label
            >
            <input
              id="sign-up-name-code"
              class="yb-input"
              name="nameCode"
              autocomplete="name"
              [(ngModel)]="name"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700" for="sign-up-code"
              >6-digit code</label
            >
            <input
              id="sign-up-code"
              class="yb-input tracking-[0.4em]"
              type="text"
              inputmode="numeric"
              name="signupCode"
              maxlength="6"
              placeholder="123456"
              [(ngModel)]="code"
              required
            />
            <p class="mt-1 text-xs text-gray-500">
              We emailed a code to <strong>{{ email }}</strong
              >.
              @if (devCode()) {
                <span class="ml-1 rounded bg-amber-100 px-1 text-amber-800"
                  >Dev code: {{ devCode() }}</span
                >
              }
            </p>
          </div>
        }
      }

      @if (error()) {
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {{ error() }}
        </p>
      }

      <button type="submit" class="yb-btn yb-btn-gold w-full" [disabled]="busy()">
        {{ busy() ? 'Please wait…' : primaryLabel() }}
      </button>

      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        @switch (step()) {
          @case ('code') {
            <button type="button" class="underline" (click)="usePassword()">
              Use my password instead
            </button>
            <button type="button" class="underline" (click)="resend()">Resend code</button>
          }
          @case ('password') {
            <button type="button" class="underline" (click)="useCode()">
              Email me a code instead
            </button>
            <a routerLink="/auth/forgot-password" class="underline">Forgot password?</a>
          }
          @case ('create') {
            <button type="button" class="underline" (click)="createWithCode()">
              Sign up with a code instead
            </button>
            <span>New here? We'll create your account.</span>
          }
          @case ('create-code') {
            <button type="button" class="underline" (click)="step.set('create')">
              Use a password instead
            </button>
            <button type="button" class="underline" (click)="createWithCode()">Resend code</button>
          }
          @default {
            <span>New or returning — this is the only sign-in you need.</span>
          }
        }
      </div>

      @if (googleEnabled) {
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span class="h-px flex-1 bg-gray-200"></span>OR<span
            class="h-px flex-1 bg-gray-200"
          ></span>
        </div>
        <button
          type="button"
          class="yb-btn w-full border border-gray-200 bg-white"
          [disabled]="busy()"
          (click)="google()"
        >
          Continue with Google
        </button>
      }
    </form>
  `,
})
export class SignInFlow {
  private readonly auth = inject(AuthService);
  readonly intro = input<string>('');
  readonly startInSignUp = input(false);
  readonly nextPath = input<string>('');
  readonly authenticated = output<AuthUser>();
  readonly ruleText = PASSWORD_RULE_TEXT;
  readonly googleEnabled = environment.googleAuthEnabled;

  readonly step = signal<Step>('email');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly devCode = signal<string | null>(null);
  email = '';
  code = '';
  name = '';
  password = '';

  readonly primaryLabel = computed(() => {
    switch (this.step()) {
      case 'email':
        return 'Continue';
      case 'code':
      case 'create-code':
        return 'Verify and continue';
      case 'password':
        return 'Sign in';
      default:
        return 'Create account';
    }
  });

  restart(): void {
    this.step.set('email');
    this.code = '';
    this.password = '';
    this.devCode.set(null);
    this.error.set(null);
  }

  async submit(): Promise<void> {
    this.error.set(null);
    switch (this.step()) {
      case 'email':
        return this.continueWithEmail();
      case 'code':
        return this.verifyCode('login');
      case 'create-code':
        return this.verifyCode('signup');
      case 'password':
        return this.signInWithPassword();
      case 'create':
        return this.createAccount();
    }
  }

  /** One call decides everything: a known email gets a code, an unknown one becomes a sign-up. */
  private async continueWithEmail(): Promise<void> {
    const email = this.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Enter a valid email address.');
      return;
    }
    if (this.startInSignUp()) {
      this.step.set('create');
      return;
    }
    this.busy.set(true);
    try {
      const data = await this.auth.requestEmailCode(email, 'login');
      this.devCode.set(data?.debug?.code ?? null);
      this.step.set('code');
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 404) {
        this.step.set('create');
      } else {
        this.error.set(this.messageFor(e, 'We could not start sign-in. Try again.'));
      }
    } finally {
      this.busy.set(false);
    }
  }

  private async verifyCode(purpose: 'login' | 'signup'): Promise<void> {
    if (!/^\d{6}$/.test(this.code.trim())) {
      this.error.set('Enter the 6-digit code from your email.');
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.auth.verifyEmailCode(
        this.email.trim(),
        this.code.trim(),
        purpose,
        this.name.trim(),
      );
      this.authenticated.emit(result.user);
    } catch (e) {
      this.error.set(this.messageFor(e, 'That code did not work. Request a new one.'));
    } finally {
      this.busy.set(false);
    }
  }

  private async signInWithPassword(): Promise<void> {
    if (!this.password) {
      this.error.set('Enter your password.');
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.auth.login({ email: this.email.trim(), password: this.password });
      this.authenticated.emit(result.user);
    } catch (e) {
      this.error.set(this.messageFor(e, 'That email and password did not match.'));
    } finally {
      this.busy.set(false);
    }
  }

  private async createAccount(): Promise<void> {
    if (!this.name.trim()) {
      this.error.set('Tell us what to call you.');
      return;
    }
    const problem = passwordProblem(this.password);
    if (problem) {
      this.error.set(problem);
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.auth.signUp({
        email: this.email.trim(),
        name: this.name.trim(),
        password: this.password,
      });
      this.authenticated.emit(result.user);
    } catch (e) {
      this.error.set(this.messageFor(e, 'We could not create your account.'));
    } finally {
      this.busy.set(false);
    }
  }

  async createWithCode(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      const data = await this.auth.requestEmailCode(this.email.trim(), 'signup');
      this.devCode.set(data?.debug?.code ?? null);
      this.step.set('create-code');
    } catch (e) {
      this.error.set(this.messageFor(e, 'We could not send a code to that address.'));
    } finally {
      this.busy.set(false);
    }
  }

  async resend(): Promise<void> {
    this.busy.set(true);
    try {
      const data = await this.auth.requestEmailCode(this.email.trim(), 'login');
      this.devCode.set(data?.debug?.code ?? null);
    } catch (e) {
      this.error.set(this.messageFor(e, 'We could not resend the code.'));
    } finally {
      this.busy.set(false);
    }
  }

  usePassword(): void {
    this.error.set(null);
    this.step.set('password');
  }

  async useCode(): Promise<void> {
    this.error.set(null);
    await this.resend();
    this.step.set('code');
  }

  async google(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.startOauthLogin('google', { intent: 'login', next: this.nextPath() });
    } catch {
      this.error.set('Google sign-in is unavailable right now.');
    } finally {
      this.busy.set(false);
    }
  }

  private messageFor(error: unknown, fallback: string): string {
    if (error instanceof ApiClientError) return error.message || fallback;
    return error instanceof Error ? error.message : fallback;
  }
}
