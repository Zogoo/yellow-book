import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { LocaleService } from '../services/locale.service';

/** Attaches the bearer token and JSON accept header to API requests. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const token = inject(AuthService).token;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Locale': inject(LocaleService).locale(),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return next(req.clone({ setHeaders: headers }));
};
