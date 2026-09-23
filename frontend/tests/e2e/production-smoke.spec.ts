import { expect, request, test } from '@playwright/test';

import {
  API_BASE,
  apiLogin,
  apiRequest,
  contextForSession,
  createContextForRole,
  createCustomer,
  deleteCustomer,
  expectAccessibleButton,
  pinLocale,
  SEED,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await pinLocale(page);
});

test.describe('Yellow Book production smoke', () => {
  test('homepage renders and every protected route leads to the one sign-in page', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /trusted help/i })).toBeVisible();
    await expect(page.getByText(SEED.salon).first()).toBeVisible();

    for (const target of ['/admin/dashboard', '/company/dashboard', '/user/dashboard']) {
      await page.goto(target);
      await expect(page).toHaveURL(
        new RegExp(`/auth/login\\?next=${encodeURIComponent(target).replace(/\//g, '%2F')}`),
      );
      await expect(page.getByRole('heading', { name: /sign in to yellow book/i })).toBeVisible();
    }

    // The old role-specific doors still work, and lead to the same place.
    await page.goto('/auth/company/login');
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.goto('/auth/staff/login');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('agency review deep-link highlights and scrolls the target review into view', async ({
    page,
  }) => {
    const context = await request.newContext();
    const { body } = await apiRequest(context, 'get', '/agency/reviews?status=approved&limit=1');
    const review = body.data[0];
    expect(review).toBeTruthy();
    await context.dispose();

    await page.goto(`/agency?id=${review.companyId}&reviewId=${review.id}`);
    const card = page.locator(`#agency-review-${review.id}`);
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/ring-amber-400/);
    await expect(card).toBeInViewport();
  });

  test('destructive admin and sub-admin controls are semantic buttons', async ({ browser }) => {
    const admin = await apiLogin('admin');
    const context = await request.newContext();
    const created = await apiRequest(context, 'post', '/users', {
      token: admin.token,
      data: {
        name: `E2E Temp ${Date.now()}`,
        email: `e2e-temp-${Date.now()}@example.com`,
        password: 'TempSecure123!',
      },
    });
    const tempUserId = created.body.data.id;

    const adminContext = await createContextForRole(browser, 'admin');
    const page = await adminContext.newPage();

    await page.goto('/admin/manage-users');
    await expectAccessibleButton(page.locator('[data-testid^="admin-delete-user-"]').first());

    await page.goto('/admin/manage-companies');
    await expectAccessibleButton(page.locator('[data-testid^="admin-delete-company-"]').first());

    await page.goto('/admin/manage-review');
    await expectAccessibleButton(page.locator('[data-testid^="admin-delete-review-"]').first());

    await adminContext.close();
    await apiRequest(context, 'delete', `/users/${tempUserId}`, { token: admin.token });

    const agentContext = await createContextForRole(browser, 'agent');
    const agentPage = await agentContext.newPage();
    await agentPage.goto('/agent/review-approval');
    await expectAccessibleButton(
      agentPage.locator('[data-testid^="subadmin-delete-review-"]').first(),
    );
    await agentContext.close();
    await context.dispose();
  });

  test('company reply composer submits once and then locks', async ({ browser }) => {
    const context = await request.newContext();
    const customer = await createCustomer(context, 'reply');
    const agent = await apiLogin('agent');

    const listings = await apiRequest(context, 'get', '/listings?limit=10');
    const beauty = listings.body.data.listings.find((l: any) => l.name === SEED.salon);
    expect(beauty).toBeTruthy();

    const created = await apiRequest(context, 'post', '/agency/reviews', {
      token: customer.token,
      data: { companyId: beauty.id, rating: 5, content: `Reply flow check ${Date.now()}` },
    });
    const reviewId = created.body.data.id;
    await apiRequest(context, 'put', `/subadmin/reviews/${reviewId}`, {
      token: agent.token,
      data: { status: 'approved' },
    });

    const companyContext = await createContextForRole(browser, 'company');
    const page = await companyContext.newPage();
    await page.goto(`/company/review/${reviewId}`);
    await expect(page.getByText(`#${reviewId}`)).toBeVisible();

    await page
      .getByPlaceholder('Write your public reply for this review...')
      .fill('Thank you for the kind words!');
    const submit = page.getByTestId('company-review-submit-reply');
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(page.getByText(/pending/i).first()).toBeVisible();

    await companyContext.close();
    const admin = await apiLogin('admin');
    await apiRequest(context, 'delete', `/agency/reviews/${reviewId}`, { token: admin.token });
    await deleteCustomer(context, customer.id);
    await context.dispose();
  });

  test('each role stays inside its namespace and can open the profile menu', async ({
    browser,
  }) => {
    const roles = [
      { role: 'admin' as const, home: '/admin/dashboard' },
      { role: 'agent' as const, home: '/agent/dashboard' },
      { role: 'company' as const, home: '/company/dashboard' },
      { role: 'user' as const, home: '/user/dashboard' },
    ];

    for (const { role, home } of roles) {
      const context = await createContextForRole(browser, role);
      const page = await context.newPage();
      await page.goto(home);
      await expect(page).toHaveURL(new RegExp(home.replace(/\//g, '\\/')));

      const menu = page.getByRole('button', { name: /open profile menu/i }).first();
      await expect(menu).toBeVisible();
      await menu.click();
      await expect(page.getByText(/signed in as/i)).toBeVisible();
      await context.close();
    }
  });

  test('sub-admin queue surfaces a pending review and confirms before deleting', async ({
    browser,
  }) => {
    const context = await request.newContext();
    const customer = await createCustomer(context, 'queue');
    const listings = await apiRequest(context, 'get', '/listings?limit=10');
    const beauty = listings.body.data.listings.find((l: any) => l.name === SEED.salon);
    const marker = `SubAdminQueue${Date.now()}`;
    const created = await apiRequest(context, 'post', '/agency/reviews', {
      token: customer.token,
      data: { companyId: beauty.id, rating: 3, content: `${marker} pending moderation` },
    });
    const reviewId = created.body.data.id;

    const agentContext = await createContextForRole(browser, 'agent');
    const page = await agentContext.newPage();
    await page.goto('/agent/review-approval');
    await page.getByPlaceholder(/search reviews/i).fill(marker);
    await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();

    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.getByTestId(`subadmin-delete-review-${reviewId}`).click();
    await expect.poll(() => dialogMessage).toMatch(/delete review/i);

    await agentContext.close();
    const admin = await apiLogin('admin');
    await apiRequest(context, 'delete', `/agency/reviews/${reviewId}`, { token: admin.token });
    await deleteCustomer(context, customer.id);
    await context.dispose();
  });

  test('company profile update and notification list use live API data', async ({ browser }) => {
    const context = await createContextForRole(browser, 'company');
    const page = await context.newPage();

    await page.goto('/company/my-company');
    const about = page.getByLabel('What your business does');
    await expect(about).toBeVisible();
    const original = await about.inputValue();
    const text = `${SEED.salon} e2e ${Date.now()}`;
    await about.fill(text);
    await page.getByTestId('company-profile-save').click();
    await expect(page.getByText(/company page saved/i).first()).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('What your business does')).toHaveValue(text);

    // Put the demo copy back, so the seeded page stays presentable.
    await page.getByLabel('What your business does').fill(original);
    await page.getByTestId('company-profile-save').click();
    await expect(page.getByText(/company page saved/i).first()).toBeVisible();

    await page.goto('/company/notification');
    await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
    await context.close();
  });

  test('notification read and clear lifecycle reflects in the list', async ({ browser }) => {
    const apiContext = await request.newContext();
    const company = await apiLogin('company');
    const title = `E2E Notification ${Date.now()}`;
    await apiRequest(apiContext, 'post', '/notifications', {
      token: company.token,
      data: { title, message: 'Created by the e2e suite' },
    });

    const context = await createContextForRole(browser, 'company');
    const page = await context.newPage();
    await page.goto('/company/notification');
    await expect(page.getByText(title)).toBeVisible();

    const markRead = page.getByTestId('company-mark-notifications-read');
    await markRead.click();
    await expect(markRead).toBeDisabled();

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/clear all notifications/i);
      await dialog.accept();
    });
    await page.getByTestId('company-clear-notifications').click();
    await expect(page.getByTestId('company-notification-item')).toHaveCount(0);

    await context.close();
    await apiContext.dispose();
  });

  test('user profile form submits with an authenticated session', async ({ browser }) => {
    const context = await createContextForRole(browser, 'user');
    const page = await context.newPage();
    await page.goto('/user/my-profile');
    await page.getByLabel('First name').fill('Jane');
    await page.getByLabel('Last name').fill('Cooper');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText(/last updated/i)).toBeVisible();
    await context.close();
  });

  test('sub-admin profile form submits with an authenticated agent session', async ({
    browser,
  }) => {
    const context = await createContextForRole(browser, 'agent');
    const page = await context.newPage();
    await page.goto('/agent/my-profile');
    // Placeholders are generic now; address the fields by their labels.
    await page.getByLabel('Full Name').fill('Wade Warren');
    await page.getByLabel('Mobile').fill('+976 8811 2233');
    await page.getByRole('button', { name: /update profile/i }).click();
    await expect(page.getByText(/last saved/i)).toBeVisible();
    await context.close();
  });

  test('responsive public smoke covers desktop and mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /trusted help/i })).toBeVisible();
    await page.goto('/popular-list');
    await expect(page.getByRole('heading', { name: /popular/i }).first()).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /toggle menu/i })).toBeVisible();
    await page.goto('/popular-list');
    await expect(page.getByRole('heading', { name: /popular/i }).first()).toBeVisible();
  });

  test('admin list views support search, filters and pagination controls', async ({ browser }) => {
    const context = await createContextForRole(browser, 'admin');
    const page = await context.newPage();

    await page.goto('/admin/manage-users');
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
    await page.getByPlaceholder(/search users/i).fill('user');
    await page.getByLabel('Status filter').selectOption('Active');
    await expect(page.getByRole('button', { name: /next/i }).first()).toBeVisible();

    await page.goto('/admin/manage-review');
    await expect(page.getByRole('heading', { name: /review management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /prev/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /next/i }).first()).toBeVisible();
    await context.close();
  });

  test('admin can edit their own profile through the edit dialog', async ({ browser }) => {
    const apiContext = await request.newContext();
    const admin = await apiLogin('admin');
    const adminId = (admin.user as any).id;
    const originalName = (admin.user as any).name;

    const context = await createContextForRole(browser, 'admin');
    const page = await context.newPage();
    await page.goto('/admin/admin-management');
    await page.getByTestId(`admin-edit-admin-${adminId}`).click();
    await expect(page.getByRole('heading', { name: /edit admin/i })).toBeVisible();

    const newName = `AdminProfileE2E-${Date.now()}`;
    await page.getByPlaceholder('e.g., Alex Johnson').fill(newName);
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByRole('heading', { name: /edit admin/i })).toBeHidden();

    const check = await apiRequest(apiContext, 'get', `/admins/${adminId}`, { token: admin.token });
    expect(check.body.data.name).toContain('AdminProfileE2E-');

    await apiRequest(apiContext, 'put', `/admins/${adminId}`, {
      token: admin.token,
      data: { name: originalName },
    });
    await context.close();
    await apiContext.dispose();
  });

  test('a user can submit a review from the public agency page', async ({ browser }) => {
    const apiContext = await request.newContext();
    const listings = await apiRequest(apiContext, 'get', '/listings?limit=10');
    const listing = listings.body.data.listings[0];
    const customer = await createCustomer(apiContext, 'public-review');

    const context = await contextForSession(browser, customer.token, customer.user);
    const page = await context.newPage();
    await page.goto(`/agency?id=${listing.id}&slug=${listing.slug}`);
    await page.getByRole('button', { name: 'Write a review' }).click();

    const dialog = page.getByRole('dialog', { name: /write a review/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: '4 star' }).click();
    const content = `Public review flow ${Date.now()}`;
    await dialog.getByPlaceholder(/what happened/i).fill(content);
    await dialog.getByRole('button', { name: /publish review/i }).click();
    await expect(page.getByText(/sent for moderation/i)).toBeVisible();

    const admin = await apiLogin('admin');
    const all = await apiRequest(
      apiContext,
      'get',
      `/agency/reviews?search=${encodeURIComponent(content)}&limit=5`,
      { token: admin.token },
    );
    const created = all.body.data.find((r: any) => r.content === content);
    expect(created).toBeTruthy();
    await apiRequest(apiContext, 'delete', `/agency/reviews/${created.id}`, { token: admin.token });

    await context.close();
    await deleteCustomer(apiContext, customer.id);
    await apiContext.dispose();
  });
});
