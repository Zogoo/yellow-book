import {
  buildLoginRedirectPath,
  canAccessPath,
  getDefaultRouteForUser,
  resolvePostLoginRedirect,
  resolveUserRole,
  sanitizeInternalPath,
} from './role-access';

describe('role-access', () => {
  it('resolves the four panel roles', () => {
    expect(resolveUserRole(null)).toBe('guest');
    expect(resolveUserRole({ role: 'USER' })).toBe('user');
    expect(resolveUserRole({ role: 'COMPANY_OWNER' })).toBe('company');
    expect(resolveUserRole({ role: 'USER', companyId: 4 })).toBe('company');
    expect(resolveUserRole({ role: 'ADMIN', adminRole: 'AGENT' })).toBe('agent');
    expect(resolveUserRole({ role: 'ADMIN', adminRole: 'SUPER_ADMIN' })).toBe('admin');
  });

  it('keeps each role inside its own panel', () => {
    const user = { role: 'USER' };
    const admin = { role: 'ADMIN', adminRole: 'SUPER_ADMIN' };
    expect(canAccessPath(user, '/user/dashboard')).toBe(true);
    expect(canAccessPath(user, '/admin/dashboard')).toBe(false);
    expect(canAccessPath(admin, '/admin/manage-users')).toBe(true);
    expect(canAccessPath(admin, '/company/dashboard')).toBe(false);
    expect(canAccessPath(user, '/popular-list')).toBe(true);
  });

  it('gates admin sub-paths on permissions', () => {
    const moderator = { role: 'ADMIN', adminRole: 'MODERATOR' };
    expect(canAccessPath(moderator, '/admin/manage-review')).toBe(true);
    expect(canAccessPath(moderator, '/admin/manage-users')).toBe(false);

    const scoped = { role: 'ADMIN', adminRole: 'VIEWER', permissions: ['users_read'] };
    expect(canAccessPath(scoped, '/admin/manage-users')).toBe(true);
    expect(canAccessPath(scoped, '/admin/settings')).toBe(false);
  });

  it('routes unauthenticated visitors to the scoped login page', () => {
    expect(buildLoginRedirectPath('/admin/dashboard')).toBe(
      '/auth/staff/login?next=%2Fadmin%2Fdashboard',
    );
    expect(buildLoginRedirectPath('/agent/dashboard')).toBe(
      '/auth/staff/login?next=%2Fagent%2Fdashboard',
    );
    expect(buildLoginRedirectPath('/company/dashboard')).toBe(
      '/auth/company/login?next=%2Fcompany%2Fdashboard',
    );
    expect(buildLoginRedirectPath('/user/dashboard')).toBe('/auth/login?next=%2Fuser%2Fdashboard');
  });

  it('refuses external redirect targets', () => {
    expect(sanitizeInternalPath('//evil.example.com')).toBe('');
    expect(sanitizeInternalPath('https://evil.example.com')).toBe('');
    expect(sanitizeInternalPath('/user/my-reviews')).toBe('/user/my-reviews');
  });

  it('falls back to the role home when `next` is not reachable', () => {
    const user = { role: 'USER' };
    expect(resolvePostLoginRedirect(user, '/admin/dashboard')).toBe('/user/dashboard');
    expect(resolvePostLoginRedirect(user, '/user/my-reviews')).toBe('/user/my-reviews');
    expect(resolvePostLoginRedirect(user, '/auth/login')).toBe('/user/dashboard');
    expect(getDefaultRouteForUser({ role: 'ADMIN', adminRole: 'AGENT' })).toBe('/agent/dashboard');
  });
});
