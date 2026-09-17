import { AuthUser } from '../models';

/**
 * Role resolution and panel access rules. A direct port of the original
 * `utils/roleAccess.js`, kept as pure functions so the guard and layouts agree.
 */
export type AppRole = 'user' | 'company' | 'agent' | 'admin' | 'guest';
export type RouteScope = 'admin' | 'agent' | 'company' | 'user' | null;

export const DEFAULT_USER_HOME = '/user/dashboard';
export const ROLE_HOME_MAP: Record<AppRole, string> = {
  user: '/user/dashboard',
  company: '/company/dashboard',
  agent: '/agent/dashboard',
  admin: '/admin/dashboard',
  guest: '/auth/login',
};

const ADMIN_PANEL_ROLE_TOKENS = new Set(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT', 'VIEWER']);
const ADMIN_ROLE_TOKENS = new Set([...ADMIN_PANEL_ROLE_TOKENS, 'AGENT']);
const AGENT_ROLE_TOKENS = new Set(['SUB_ADMIN', 'SUBADMIN', 'AGENT']);
const COMPANY_ROLE_TOKENS = new Set([
  'COMPANY_OWNER',
  'COMPANYOWNER',
  'BUSINESS_OWNER',
  'BUSINESSOWNER',
  'BUSINESS',
  'COMPANY',
  'OWNER',
]);
const USER_ROLE_TOKENS = new Set(['USER', 'CUSTOMER', 'GUEST', 'TOURIST', 'MEMBER']);
const ADMIN_PERMISSION_HINTS = [
  'admins_read',
  'agents_write',
  'users_read',
  'users_write',
  'settings_read',
  'settings_write',
  'companies_read',
  'companies_write',
  'categories_read',
  'categories_write',
  'specializations_read',
  'specializations_write',
  'reviews_read',
  'reviews_moderate',
];

export const GUEST_ONLY_PATHS = new Set([
  '/auth/login',
  '/auth/staff/login',
  '/auth/company/login',
  '/auth/register',
  '/auth/forgot-password',
]);

export const AUTH_LOGIN_PATHS = {
  user: '/auth/login',
  staff: '/auth/staff/login',
  company: '/auth/company/login',
};

type Loose = Record<string, unknown> | null | undefined;

function normalizeToken(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizePermission(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pick(obj: Loose, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function collectRoleTokens(user: Loose): Set<string> {
  const tokens = new Set<string>();
  const keys = [
    'role',
    'accountRole',
    'account_role',
    'userRole',
    'user_role',
    'type',
    'userType',
    'user_type',
    'accountType',
    'account_type',
    'kind',
    'roles',
    'roleNames',
    'account.role',
    'account.type',
    'profile.role',
    'profile.type',
    'meta.role',
    'meta.accountRole',
  ];
  for (const key of keys) {
    const value = pick(user, key);
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      const token = normalizeToken(v);
      if (token) tokens.add(token);
    }
  }
  return tokens;
}

function resolveAdminRoleToken(user: Loose): string {
  const keys = [
    'adminRole',
    'admin_role',
    'subRole',
    'sub_role',
    'admin.role',
    'admin.type',
    'meta.adminRole',
  ];
  for (const key of keys) {
    const token = normalizeToken(pick(user, key));
    if (token && ADMIN_ROLE_TOKENS.has(token)) return token;
  }
  for (const token of collectRoleTokens(user)) {
    if (ADMIN_ROLE_TOKENS.has(token)) return token;
  }
  return '';
}

export function extractPermissionSet(user: Loose): Set<string> {
  const set = new Set<string>();
  const sources = ['permissions', 'permission', 'scopes', 'scope', 'meta.permissions'];
  for (const key of sources) {
    const value = pick(user, key);
    const values = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(/[,\s]+/)
        : [];
    for (const v of values) {
      const token = normalizePermission(v);
      if (token) set.add(token);
    }
  }
  return set;
}

function hasSubAdminShape(user: Loose): boolean {
  if (!user) return false;
  const u = user as Record<string, unknown>;
  if (u['isAgent'] === true || u['isSubAdmin'] === true || u['isSubadmin'] === true) return true;
  if (typeof u['subadminProfile'] === 'object' && u['subadminProfile']) return true;
  if (typeof u['subadmin_profile'] === 'object' && u['subadmin_profile']) return true;
  return ['assignedCompanies', 'assigned_companies', 'assignedReviews', 'assigned_reviews'].some(
    (k) => Array.isArray(u[k]),
  );
}

function hasCompanyShape(user: Loose): boolean {
  if (!user) return false;
  const u = user as Record<string, unknown>;
  if (u['isCompanyOwner'] === true || u['isBusinessOwner'] === true) return true;
  if (
    ['companyId', 'company_id', 'ownerId', 'owner_id'].some(
      (k) => u[k] !== null && u[k] !== undefined,
    )
  )
    return true;
  if (
    ['company', 'companyProfile', 'company_profile'].some((k) => typeof u[k] === 'object' && u[k])
  )
    return true;
  if (['ownedCompanies', 'owned_companies'].some((k) => Array.isArray(u[k]))) return true;
  return ['signupMethod', 'signup_method', 'signupChannel', 'signup_channel'].some((k) =>
    normalizeToken(u[k]).includes('BUSINESS'),
  );
}

export function resolveUserRole(user: AuthUser | Loose): AppRole {
  if (!user) return 'guest';
  const tokens = collectRoleTokens(user);
  const adminRoleToken = resolveAdminRoleToken(user);
  if (adminRoleToken === 'AGENT') return 'agent';
  if ([...tokens].some((t) => AGENT_ROLE_TOKENS.has(t))) return 'agent';
  if (hasSubAdminShape(user)) return 'agent';
  if ([...tokens].some((t) => COMPANY_ROLE_TOKENS.has(t))) return 'company';
  if (hasCompanyShape(user)) return 'company';
  if (ADMIN_PANEL_ROLE_TOKENS.has(adminRoleToken)) return 'admin';
  if ([...tokens].some((t) => ADMIN_PANEL_ROLE_TOKENS.has(t))) return 'admin';
  const permissions = extractPermissionSet(user);
  if (ADMIN_PERMISSION_HINTS.some((p) => permissions.has(p))) return 'admin';
  if ([...tokens].some((t) => USER_ROLE_TOKENS.has(t))) return 'user';
  return 'user';
}

export function getRouteScope(path: string): RouteScope {
  const clean = (path || '').split('?')[0];
  if (/^\/admin(\/|$)/.test(clean)) return 'admin';
  if (/^\/agent(\/|$)/.test(clean)) return 'agent';
  if (/^\/company(\/|$)/.test(clean)) return 'company';
  if (/^\/user(\/|$)/.test(clean)) return 'user';
  return null;
}

export function canAccessAdminPath(user: AuthUser | Loose, path: string): boolean {
  const clean = (path || '').split('?')[0];
  const adminToken = resolveAdminRoleToken(user);
  if (adminToken === 'SUPER_ADMIN' || adminToken === 'ADMIN') return true;
  if (adminToken === 'MODERATOR') {
    return (
      clean === '/admin' ||
      clean.startsWith('/admin/dashboard') ||
      clean.startsWith('/admin/manage-review')
    );
  }
  if (clean === '/admin' || clean.startsWith('/admin/dashboard')) return true;
  const permissions = extractPermissionSet(user);
  const any = (...list: string[]) => list.some((p) => permissions.has(p));
  if (clean.startsWith('/admin/manage-users')) return any('users_read', 'users_write');
  if (clean.startsWith('/admin/manage-companies')) {
    return any('companies_read', 'companies_write', 'content_read', 'content_write');
  }
  if (clean.startsWith('/admin/manage-categories')) {
    return any('categories_read', 'categories_write', 'content_read', 'content_write');
  }
  if (clean.startsWith('/admin/manage-specializations')) {
    return any('specializations_read', 'specializations_write', 'content_read', 'content_write');
  }
  if (clean.startsWith('/admin/manage-review')) {
    return any('reviews_read', 'reviews_moderate', 'reports_read', 'reports_write', 'content_read');
  }
  if (clean.startsWith('/admin/admin-management') || clean.startsWith('/admin/create-sub-admin')) {
    return any('admins_read', 'agents_write', 'admins_manage', 'settings_write', 'users_write');
  }
  if (clean.startsWith('/admin/settings')) return any('settings_read', 'settings_write');
  return permissions.size > 0;
}

export function canAccessPath(user: AuthUser | Loose, path: string): boolean {
  const scope = getRouteScope(path);
  if (!scope) return true;
  const role = resolveUserRole(user);
  if (role !== scope) return false;
  if (scope === 'admin') return canAccessAdminPath(user, path);
  return true;
}

export function getDefaultRouteForUser(user: AuthUser | Loose): string {
  return ROLE_HOME_MAP[resolveUserRole(user)];
}

export function sanitizeInternalPath(value: unknown): string {
  if (typeof value !== 'string') return '';
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const trimmed = decoded.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '';
  return trimmed;
}

export function isGuestOnlyPath(path: string): boolean {
  return GUEST_ONLY_PATHS.has((path || '').split('?')[0]);
}

export function resolvePostLoginRedirect(
  user: AuthUser | Loose,
  nextPath?: unknown,
  fallbackPath = '',
): string {
  const fallbackSanitized = sanitizeInternalPath(fallbackPath);
  const fallback =
    fallbackSanitized && canAccessPath(user, fallbackSanitized)
      ? fallbackSanitized
      : getDefaultRouteForUser(user);
  const next = sanitizeInternalPath(nextPath);
  if (next && !isGuestOnlyPath(next) && canAccessPath(user, next)) return next;
  return fallback;
}

export function buildLoginRedirectPath(targetPath: string): string {
  const scope = getRouteScope(targetPath);
  const login =
    scope === 'admin' || scope === 'agent'
      ? AUTH_LOGIN_PATHS.staff
      : scope === 'company'
        ? AUTH_LOGIN_PATHS.company
        : AUTH_LOGIN_PATHS.user;
  const next = sanitizeInternalPath(targetPath) || '/';
  return `${login}?next=${encodeURIComponent(next)}`;
}
