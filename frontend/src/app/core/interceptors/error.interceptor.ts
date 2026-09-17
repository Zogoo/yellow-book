import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { buildLoginRedirectPath, getRouteScope } from '../utils/role-access';

/** Drops an expired session on 401 (except the auth endpoints themselves). */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCall =
        /\/auth\/(login|register|email-code|oauth|forgot-password|reset-password)/.test(req.url);
      if (error.status === 401 && auth.token && !isAuthCall) {
        auth.clearSession();
        const current = router.url;
        if (getRouteScope(current)) void router.navigateByUrl(buildLoginRedirectPath(current));
      }
      return throwError(() => error);
    }),
  );
};
