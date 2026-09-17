import {
  APIRequestContext,
  Browser,
  BrowserContext,
  Locator,
  expect,
  request,
} from '@playwright/test';

export const API_BASE = process.env['E2E_API_BASE_URL'] ?? 'http://127.0.0.1:3001/api/v1';

export const FIXTURES = {
  admin: { email: 'admin@yellowbook.local', password: 'AdminSecure123!' },
  agent: { email: 'agent@yellowbook.local', password: 'AgentSecure123!' },
  company: { email: 'company@yellowbook.local', password: 'CompanySecure123!' },
  user: { email: 'user@yellowbook.local', password: 'UserSecure123!' },
} as const;

export type Role = keyof typeof FIXTURES;

export interface Session {
  token: string;
  user: Record<string, unknown>;
}

const sessions = new Map<Role, Session>();

export async function apiRequest(
  context: APIRequestContext,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  options: { token?: string; data?: unknown; expectStatus?: number[] } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  if (options.data !== undefined) headers['Content-Type'] = 'application/json';
  const response = await context[method](`${API_BASE}${path}`, {
    headers,
    data: options.data as any,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  const allowed = options.expectStatus ?? [200, 201, 204];
  if (!allowed.includes(response.status())) {
    throw new Error(
      `${method.toUpperCase()} ${path} -> ${response.status()} ${text.slice(0, 300)}`,
    );
  }
  return { status: response.status(), body };
}

/** Logs a role in once per run, retrying the per-IP rate limit. */
export async function apiLogin(role: Role): Promise<Session> {
  const cached = sessions.get(role);
  if (cached) return cached;

  const context = await request.newContext();
  try {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await context.post(`${API_BASE}/auth/login`, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        data: FIXTURES[role],
      });
      if (response.status() === 429) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        continue;
      }
      const body = await response.json();
      if (!body?.data?.token || !body?.data?.user) {
        throw new Error(
          `Login for ${role} returned ${response.status()}: ${JSON.stringify(body).slice(0, 300)}`,
        );
      }
      const session: Session = { token: body.data.token, user: body.data.user };
      sessions.set(role, session);
      return session;
    }
    throw new Error(`Login for ${role} kept hitting the rate limit`);
  } finally {
    await context.dispose();
  }
}

/** A browser context that already has the role's token/user seeded in localStorage. */
export async function createContextForRole(browser: Browser, role: Role): Promise<BrowserContext> {
  const session = await apiLogin(role);
  const context = await browser.newContext();
  await context.addInitScript(
    ([token, user]) => {
      window.localStorage.setItem('token', token as string);
      window.localStorage.setItem('user', user as string);
    },
    [session.token, JSON.stringify(session.user)],
  );
  return context;
}

export async function expectAccessibleButton(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const tagName = await locator.evaluate((el) => el.tagName);
  expect(tagName).toBe('BUTTON');
  const ariaLabel = await locator.getAttribute('aria-label');
  const text = (await locator.textContent())?.trim() ?? '';
  expect(Boolean(ariaLabel) || text.length > 0).toBe(true);
}
