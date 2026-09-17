import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('persists the token and user under the `token` and `user` keys', async () => {
    const pending = service.login({ email: 'User@Example.com', password: 'UserSecure123!' });

    const login = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(login.request.method).toBe('POST');
    expect(login.request.body.email).toBe('user@example.com');
    login.flush({
      data: {
        token: 'jwt-token',
        user: { id: 2, name: 'Regular User', email: 'user@example.com', role: 'USER' },
      },
    });

    // adoptSession re-reads /auth/me so the stored snapshot always matches the server.
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne(`${environment.apiUrl}/auth/me`).flush({
      data: {
        token: 'jwt-token',
        user: { id: 2, name: 'Regular User', email: 'user@example.com', role: 'USER' },
      },
    });

    await pending;
    expect(service.token).toBe('jwt-token');
    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(JSON.parse(localStorage.getItem('user') ?? '{}').email).toBe('user@example.com');
    expect(service.role()).toBe('user');
  });

  it('clears the stored session on logout', () => {
    service.setSession('jwt-token', { id: 1, name: 'A', email: 'a@b.c', role: 'USER' });
    service.clearSession();
    expect(service.token).toBe('');
    expect(localStorage.getItem('token')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('rejects providers other than Google for OAuth', async () => {
    await expect(service.startOauthLogin('facebook')).rejects.toThrow(/Only Google/);
  });
});
