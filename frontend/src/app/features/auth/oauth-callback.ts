import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { resolvePostLoginRedirect } from '../../core/utils/role-access';

/** Landing page for the OAuth redirect (`?provider=&token=` or `?code=&state=`). */
@Component({
  selector: 'app-oauth-callback-page',
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-md py-24 text-center">
      @if (error()) {
        <h1 class="text-xl font-bold text-red-600">Sign-in failed</h1>
        <p class="mt-2 text-sm text-gray-600">{{ error() }}</p>
        <a routerLink="/auth/login" class="yb-btn yb-btn-gold mt-6">Back to sign in</a>
      } @else {
        <h1 class="text-xl font-bold text-[#212121]">Completing sign-in…</h1>
        <p class="mt-2 text-sm text-gray-500">Hang tight while we verify your account.</p>
      }
    </div>
  `,
})
export class OauthCallbackPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const q = this.route.snapshot.queryParamMap;
    const provider = (q.get('provider') ?? 'google').toLowerCase();
    if (q.get('error')) {
      this.error.set(
        q.get('error_description') || q.get('error') || 'The provider returned an error.',
      );
      return;
    }
    const context = this.auth.consumeOauthContext(provider);
    const intent = (q.get('intent') as 'login' | 'register' | null) ?? context?.intent ?? 'login';
    const next = q.get('next') ?? context?.next ?? '';
    try {
      if (q.get('token')) {
        await this.auth.adoptToken(q.get('token')!);
      } else if (q.get('idToken') || q.get('code')) {
        await this.auth.completeOauthLogin(provider, {
          idToken: q.get('idToken') ?? undefined,
          code: q.get('code') ?? undefined,
          state: q.get('state') ?? undefined,
          redirectUri: `${window.location.origin}/auth/oauth/callback?provider=${provider}`,
        });
      } else {
        this.error.set('Missing OAuth credentials in the callback URL.');
        return;
      }
      const user = this.auth.user();
      const target =
        intent === 'register'
          ? '/company/dashboard'
          : resolvePostLoginRedirect(user, next, '/user/dashboard');
      await this.router.navigateByUrl(target);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unable to complete sign-in.');
    }
  }
}
