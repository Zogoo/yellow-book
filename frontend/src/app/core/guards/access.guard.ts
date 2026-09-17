import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';
import {
  buildLoginRedirectPath,
  canAccessPath,
  getDefaultRouteForUser,
  getRouteScope,
  isGuestOnlyPath,
  resolvePostLoginRedirect,
} from '../utils/role-access';

let roleBootstrapDone = false;

/**
 * The single global access rule (port of `middleware/access.global.js`):
 * guest-only auth pages bounce signed-in users, panel paths require the
 * matching role, and unauthenticated panel visits go to the scoped login.
 */
export const accessGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const url = state.url;
  const path = url.split('?')[0];

  if (!auth.token) auth.hydrateFromStorage();

  const user = auth.user();
  if (auth.token && (!user || !user['role']) && !roleBootstrapDone) {
    roleBootstrapDone = true;
    try {
      await auth.fetchMe();
    } catch {
      auth.clearSession();
    }
  }

  const current = auth.user();
  const authenticated = auth.isAuthenticated();
  const nextParam = new URLSearchParams(url.split('?')[1] ?? '').get('next');

  if (isGuestOnlyPath(path)) {
    if (!authenticated) return true;
    return router.parseUrl(resolvePostLoginRedirect(current, nextParam));
  }

  if (!getRouteScope(path)) return true;
  if (!authenticated) return router.parseUrl(buildLoginRedirectPath(url));
  if (canAccessPath(current, path)) return true;

  const fallback = getDefaultRouteForUser(current);
  return router.parseUrl(fallback === path ? '/' : fallback);
};
