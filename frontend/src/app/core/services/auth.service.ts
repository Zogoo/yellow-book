import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthResponse, AuthUser } from '../models';
import { resolveUserRole } from '../utils/role-access';
import { ApiClientError, ApiService } from './api.service';
import { ToastService } from './toast.service';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const OAUTH_FLOW_KEY = 'auth.oauth.flow';
const OAUTH_FLOW_MAX_AGE_MS = 30 * 60 * 1000;

export interface EmailChallenge {
  email: string;
  sentAt: number;
  expiresAt: number | null;
}

export interface OauthFlowContext {
  intent: 'login' | 'register';
  next: string;
  createdAt: number;
}

export class AuthFlowError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'AuthFlowError';
  }
}

function safeStorage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Session state: the bearer token and the user snapshot, persisted under the
 * `token` and `user` localStorage keys (the e2e suite seeds those directly).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly user = signal<AuthUser | null>(null);
  readonly tokenSignal = signal<string>('');
  readonly pendingChallenge = signal<EmailChallenge | null>(null);
  readonly isAuthenticated = computed(() => Boolean(this.tokenSignal() || this.user()?.id));
  readonly role = computed(() => resolveUserRole(this.user()));

  constructor() {
    this.hydrateFromStorage();
  }

  get token(): string {
    return this.tokenSignal();
  }

  hydrateFromStorage(): void {
    const storage = safeStorage('local');
    if (!storage) return;
    const token = storage.getItem(TOKEN_KEY) || '';
    let user: AuthUser | null = null;
    try {
      const raw = storage.getItem(USER_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      user = parsed && typeof parsed === 'object' ? (parsed as AuthUser) : null;
    } catch {
      user = null;
    }
    this.tokenSignal.set(token);
    this.user.set(user);
  }

  setSession(token: string, user: AuthUser | null): void {
    this.tokenSignal.set(token || '');
    this.user.set(user);
    const storage = safeStorage('local');
    storage?.setItem(TOKEN_KEY, token || '');
    storage?.setItem(USER_KEY, JSON.stringify(user ?? ''));
  }

  clearSession(options: { notify?: boolean } = {}): void {
    this.tokenSignal.set('');
    this.user.set(null);
    this.pendingChallenge.set(null);
    const storage = safeStorage('local');
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    if (options.notify) this.toast.success('Logged out successfully');
  }

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    this.clearSession();
    const email = (payload.email || '').trim().toLowerCase();
    if (!email) throw new AuthFlowError('Email is required', 'EMAIL_REQUIRED');
    if (!payload.password) throw new AuthFlowError('Password is required', 'PASSWORD_REQUIRED');
    const data = await this.api.postData<AuthResponse>('auth/login', {
      email,
      password: payload.password,
    });
    return this.adoptSession(data, 'Logged in successfully');
  }

  async fetchMe(): Promise<AuthUser> {
    const data = await this.api.getData<AuthResponse>('auth/me', undefined, {
      toast: { showError: false },
    });
    if (!data?.user) throw new AuthFlowError('User not found', 'USER_NOT_FOUND', 401);
    this.setSession(data.token || this.token, data.user);
    return data.user;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) await this.api.postData('auth/logout', {}, { toast: { showError: false } });
    } catch {
      // A failed logout call must never keep the user signed in locally.
    }
    this.clearSession({ notify: true });
    await this.router.navigateByUrl('/auth/login');
  }

  async requestEmailCode(
    email: string,
    purpose: 'login' | 'signup' | 'reset_password' = 'login',
  ): Promise<{ message: string; expiresAt?: number; debug?: { code: string } }> {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) throw new AuthFlowError('Email is required', 'EMAIL_REQUIRED');
    const data = await this.api.postData<{
      message: string;
      expiresAt?: number;
      debug?: { code: string };
    }>('auth/email-code/request', { email: normalized, purpose }, { toast: { showError: false } });
    this.pendingChallenge.set({
      email: normalized,
      sentAt: Date.now(),
      expiresAt: data?.expiresAt ?? null,
    });
    return data;
  }

  async verifyEmailCode(
    email: string,
    code: string,
    purpose: 'login' | 'signup' = 'login',
    name = '',
  ): Promise<AuthResponse> {
    const normalized = (email || '').trim().toLowerCase();
    const data = await this.api.postData<AuthResponse>(
      'auth/email-code/verify',
      { email: normalized, otp: code, code, purpose, name },
      { toast: { showError: false } },
    );
    this.pendingChallenge.set(null);
    return this.adoptSession(data, purpose === 'signup' ? 'Welcome to Yellow Book' : 'Signed in');
  }

  /** Customer sign-up: the same endpoint as a business, without a company. */
  async signUp(payload: { email: string; name: string; password: string }): Promise<AuthResponse> {
    this.clearSession();
    const data = await this.api.postData<AuthResponse>(
      'auth/register',
      {
        email: payload.email.trim().toLowerCase(),
        name: payload.name.trim(),
        password: payload.password,
      },
      { toast: { showError: false } },
    );
    return this.adoptSession(data, 'Welcome to Yellow Book');
  }

  /** Change the password of the signed-in account; other sessions end server-side. */
  async changePassword(currentPassword: string, password: string): Promise<void> {
    await this.api.putData(
      'auth/password',
      { currentPassword, password },
      { toast: { showError: false } },
    );
  }

  clearEmailChallenge(): void {
    this.pendingChallenge.set(null);
  }

  async register(payload: Record<string, unknown>): Promise<AuthResponse> {
    this.clearSession();
    const email = String(payload['email'] ?? '')
      .trim()
      .toLowerCase();
    const companyName = String(payload['companyName'] ?? payload['name'] ?? '').trim();
    if (!email) throw new AuthFlowError('Email is required', 'EMAIL_REQUIRED');
    if (!companyName) throw new AuthFlowError('Company name is required', 'COMPANY_NAME_REQUIRED');
    const data = await this.api.postData<AuthResponse>('auth/register', {
      ...payload,
      email,
      companyName,
      role: 'company',
    });
    return this.adoptSession(data, 'Registration completed successfully');
  }

  async forgotPassword(email: string): Promise<void> {
    await this.api.postData('auth/forgot-password', { email: (email || '').trim().toLowerCase() });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.api.postData('auth/reset-password', { token, password });
  }

  async startOauthLogin(
    provider: string,
    options: { intent?: 'login' | 'register'; next?: string; redirect?: boolean } = {},
  ): Promise<{ provider: string; authorizationUrl: string; state?: string; expiresAt?: string }> {
    const normalized = (provider || '').toLowerCase();
    if (normalized !== 'google') {
      throw new AuthFlowError('Only Google OAuth is supported', 'OAUTH_PROVIDER_INVALID');
    }
    const redirectUri = `${window.location.origin}/auth/oauth/callback?provider=${normalized}`;
    this.storeOauthContext(normalized, {
      intent: options.intent ?? 'login',
      next: options.next ?? '',
      createdAt: Date.now(),
    });
    const data = await this.api.getData<{
      authorizationUrl: string;
      state?: string;
      expiresAt?: string;
    }>(
      `auth/oauth/${normalized}/authorize`,
      { redirectUri, intent: options.intent ?? 'login', next: options.next ?? '' },
      { toast: { showError: false } },
    );
    if (!data?.authorizationUrl)
      throw new AuthFlowError('OAuth is not configured', 'OAUTH_CONFIG_ERROR', 500);
    if (options.redirect !== false) window.location.assign(data.authorizationUrl);
    return { provider: normalized, ...data };
  }

  consumeOauthContext(provider: string): OauthFlowContext | null {
    const storage = safeStorage('session');
    if (!storage) return null;
    try {
      const raw = storage.getItem(OAUTH_FLOW_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, OauthFlowContext>) : {};
      const entry = map[provider];
      delete map[provider];
      storage.setItem(OAUTH_FLOW_KEY, JSON.stringify(map));
      if (!entry || Date.now() - entry.createdAt > OAUTH_FLOW_MAX_AGE_MS) return null;
      return entry;
    } catch {
      return null;
    }
  }

  async completeOauthLogin(
    provider: string,
    payload: { idToken?: string; code?: string; state?: string; redirectUri?: string },
  ): Promise<AuthResponse> {
    const data = await this.api.postData<AuthResponse>(`auth/oauth/${provider}/callback`, {
      provider,
      ...payload,
    });
    return this.adoptSession(data, 'Logged in successfully');
  }

  /** Accepts a token issued by the server-side OAuth redirect (`?token=`). */
  async adoptToken(token: string): Promise<AuthUser> {
    this.setSession(token, null);
    return this.fetchMe();
  }

  private async adoptSession(data: AuthResponse, message: string): Promise<AuthResponse> {
    const token = data?.token;
    if (!token) throw new AuthFlowError('Token missing from response', 'TOKEN_MISSING', 401);
    let user = data.user ?? null;
    this.setSession(token, user);
    if (!user) {
      user = await this.fetchMe();
    } else {
      try {
        user = await this.fetchMe();
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) throw error;
      }
    }
    this.toast.success(message);
    return { token, user };
  }

  private storeOauthContext(provider: string, context: OauthFlowContext): void {
    const storage = safeStorage('session');
    if (!storage) return;
    try {
      const raw = storage.getItem(OAUTH_FLOW_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, OauthFlowContext>) : {};
      map[provider] = context;
      storage.setItem(OAUTH_FLOW_KEY, JSON.stringify(map));
    } catch {
      // sessionStorage may be unavailable; the flow still works via the callback query.
    }
  }
}
