import { expect, request, test } from '@playwright/test';

import {
  apiLogin,
  apiRequest,
  contextForSession,
  createContextForRole,
  createCustomer,
  deleteCustomer,
  pinLocale,
  SEED,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await pinLocale(page);
});

test.describe('Yellow Book feature walkthrough', () => {
  test('a guest is offered sign-in, with the reason, instead of a dead end', async ({ page }) => {
    const api = await request.newContext();
    const listings = await apiRequest(api, 'get', '/listings?limit=10');
    const beauty = listings.body.data.listings.find((l: any) => l.name === SEED.salon);

    // The public feed never carries a reviewer's email address.
    const feed = await apiRequest(api, 'get', `/agency/reviews?companyId=${beauty.id}&limit=1`);
    expect(feed.body.data[0].reviewerEmail).toBeNull();
    await api.dispose();

    await page.goto(`/agency?id=${beauty.id}&slug=${beauty.slug}`);
    await expect(page.getByRole('heading', { name: SEED.salon, exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Write a review' }).click();
    const dialog = page.getByRole('dialog', { name: /sign in to yellow book/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(new RegExp(`Sign in to review ${SEED.salon}`))).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: 'Like review' }).first().click();
    await expect(page.getByRole('dialog', { name: /sign in to yellow book/i })).toBeVisible();
  });

  test('category filters narrow the listing set and clear again', async ({ page }) => {
    await page.goto('/catagory?name=Beauty%20%26%20wellbeing');
    await expect(page.getByRole('heading', { name: SEED.beautyCategory.en })).toBeVisible();
    await expect(page.getByRole('heading', { name: SEED.salon })).toBeVisible();

    // A speciality the one salon in this category does not offer empties the list.
    await page.getByLabel(SEED.beautyOtherService, { exact: true }).check();
    await expect(page.getByText(/no companies match these filters/i)).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByRole('heading', { name: SEED.salon })).toBeVisible();
  });

  test('popular list search filters the results', async ({ page }) => {
    await page.goto('/popular-list');
    await expect(page.getByRole('heading', { name: 'Popular list' })).toBeVisible();
    await page.getByPlaceholder('Search by company, service or city').fill('tekhno');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText(/showing 1–1 of 1 companies/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: SEED.tech })).toBeVisible();
  });

  test('a business can register through the three-step wizard and lands in its panel', async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `e2e-agency-${stamp}@example.com`;

    await page.goto('/auth/register');
    await page.getByLabel(/company name/i).fill(`E2E Agency ${stamp}`);
    await page.getByLabel('Website', { exact: true }).fill('https://e2e-agency.example.com');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByLabel(/what does your business do/i).fill('Registered by the e2e suite.');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('Owner');
    await page.getByLabel(/work email/i).fill(email);
    await page.getByLabel(/^password/i).fill('E2eAgencyStrong1!');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page).toHaveURL(/\/company\/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    const api = await request.newContext();
    const admin = await apiLogin('admin');
    const found = await apiRequest(
      api,
      'get',
      `/companies?search=E2E%20Agency%20${stamp}&limit=1`,
      { token: admin.token },
    );
    const company = found.body.data[0];
    expect(company).toBeTruthy();
    await apiRequest(api, 'delete', `/companies/${company.id}`, { token: admin.token });
    const owner = await apiRequest(
      api,
      'get',
      `/users?search=${encodeURIComponent(email)}&limit=1`,
      { token: admin.token },
    );
    await apiRequest(api, 'delete', `/users/${owner.body.data[0].id}`, { token: admin.token });
    await api.dispose();
  });

  test('admin adds a company through the wizard and deletes it again', async ({ browser }) => {
    const api = await request.newContext();
    const admin = await apiLogin('admin');
    const stamp = Date.now();
    const name = `E2E Wizard Co ${stamp}`;
    const ownerEmail = `e2e-wizard-owner-${stamp}@example.com`;
    // A dedicated owner keeps the shared demo user a plain customer for the other tests.
    const owner = await apiRequest(api, 'post', '/users', {
      token: admin.token,
      data: { name: 'E2E Wizard Owner', email: ownerEmail, password: 'E2eWizardOwner1!' },
    });
    const ownerId = owner.body.data.id;

    const context = await createContextForRole(browser, 'admin');
    const page = await context.newPage();
    try {
      await page.goto('/admin/manage-companies');
      await page.getByRole('button', { name: '+ Add Company' }).click();
      const dialog = page.getByRole('dialog', { name: /add new company profile/i });
      await dialog.getByLabel('Company Name').fill(name);
      await dialog.getByLabel('Website').fill('https://wizard.example.com');
      await dialog.getByRole('button', { name: 'Next' }).click();
      await dialog.getByLabel('Company Description').fill('Created by the e2e wizard test.');
      await dialog.getByRole('button', { name: 'Next' }).click();
      await dialog.getByLabel('Owner email').fill(ownerEmail);
      await dialog.getByRole('button', { name: 'Submit' }).click();

      await expect(page.getByText('Company added')).toBeVisible();
      await expect(page.getByRole('cell', { name: name, exact: true })).toBeVisible();

      page.on('dialog', (d) => d.accept());
      await page.getByRole('button', { name: `Delete ${name}` }).click();
      await expect(page.getByText(`${name} removed`)).toBeVisible();
      await expect(page.getByRole('cell', { name: name, exact: true })).toBeHidden();
    } finally {
      await context.close();
      const leftovers = await apiRequest(
        api,
        'get',
        `/companies?search=${encodeURIComponent(name)}&limit=5`,
        { token: admin.token },
      );
      for (const company of leftovers.body.data ?? []) {
        await apiRequest(api, 'delete', `/companies/${company.id}`, {
          token: admin.token,
          expectStatus: [200, 404],
        });
      }
      await apiRequest(api, 'delete', `/users/${ownerId}`, {
        token: admin.token,
        expectStatus: [200, 404],
      });
      await api.dispose();
    }
  });

  test('cancelling an assignment status change leaves the status untouched', async ({
    browser,
  }) => {
    const context = await createContextForRole(browser, 'agent');
    const page = await context.newPage();
    await page.goto('/agent/assign-companies');

    const row = page.getByRole('row', { name: new RegExp(SEED.salon) });
    const select = row.getByRole('combobox');
    await expect(select).toHaveValue('Verified');

    await select.selectOption('Pending');
    await expect(page.getByRole('dialog', { name: /update status\?/i })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // The dropdown must snap back: nothing was saved.
    await expect(select).toHaveValue('Verified');
    await page.reload();
    await expect(
      page.getByRole('row', { name: new RegExp(SEED.salon) }).getByRole('combobox'),
    ).toHaveValue('Verified');
    await context.close();
  });

  test('a moderator sub-admin is confined to the agent panel and blocked by permissions', async ({
    browser,
  }) => {
    const api = await request.newContext();
    const admin = await apiLogin('admin');
    const email = `e2e-mod-${Date.now()}@example.com`;
    const created = await apiRequest(api, 'post', '/admins', {
      token: admin.token,
      data: {
        name: 'E2E Moderator',
        email,
        password: 'E2eModeratorPass1!',
        role: 'Moderator',
        permissions: ['reviews_read', 'reviews_moderate'],
      },
    });
    const moderatorId = created.body.data.id;

    const login = await apiRequest(api, 'post', '/auth/login', {
      data: { email, password: 'E2eModeratorPass1!' },
    });
    const token = login.body.data.token;
    const user = login.body.data.user;

    // The API refuses the endpoints this sub-admin has no permission for.
    await apiRequest(api, 'get', '/users', { token, expectStatus: [403] });
    await apiRequest(api, 'get', '/specialization', { token, expectStatus: [403] });
    await apiRequest(api, 'get', '/subadmin/reviews', { token });

    const context = await browser.newContext();
    await context.addInitScript(
      ([t, u]) => {
        window.localStorage.setItem('token', t as string);
        window.localStorage.setItem('user', u as string);
      },
      [token, JSON.stringify(user)],
    );
    const page = await context.newPage();
    await page.goto('/admin/manage-users');
    await expect(page).toHaveURL(/\/agent\/dashboard/);
    await context.close();

    await apiRequest(api, 'delete', `/admins/${moderatorId}`, { token: admin.token });
    await api.dispose();
  });

  test('a user can edit and delete one of their own reviews', async ({ browser }) => {
    const api = await request.newContext();
    const customer = await createCustomer(api, 'edit-review');
    const listings = await apiRequest(api, 'get', '/listings?limit=10');
    const listing = listings.body.data.listings[0];
    const created = await apiRequest(api, 'post', '/agency/reviews', {
      token: customer.token,
      data: { companyId: listing.id, rating: 3, content: `Editable review ${Date.now()}` },
    });
    const reviewId = created.body.data.id;

    const context = await contextForSession(browser, customer.token, customer.user);
    const page = await context.newPage();
    await page.goto('/user/my-reviews');

    const card = page.getByTestId(`user-review-${reviewId}`);
    await card.getByRole('button', { name: 'Edit' }).click();
    const edited = `Edited by the e2e suite ${Date.now()}`;
    await card.getByLabel('Review text').fill(edited);
    await card.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Review updated')).toBeVisible();
    await expect(page.getByText(edited)).toBeVisible();

    page.on('dialog', (d) => d.accept());
    await card.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Review deleted')).toBeVisible();
    await expect(card).toBeHidden();
    await context.close();

    const admin = await apiLogin('admin');
    await apiRequest(api, 'delete', `/agency/reviews/${reviewId}`, {
      token: admin.token,
      expectStatus: [200, 404],
    });
    await deleteCustomer(api, customer.id);
    await api.dispose();
  });

  test('admin moderates a review from the detail dialog and the stats follow', async ({
    browser,
  }) => {
    const api = await request.newContext();
    const customer = await createCustomer(api, 'moderation');
    const listings = await apiRequest(api, 'get', '/listings?limit=10');
    const marker = `Moderation ${Date.now()}`;
    const created = await apiRequest(api, 'post', '/agency/reviews', {
      token: customer.token,
      data: {
        companyId: listings.body.data.listings[0].id,
        rating: 2,
        content: `${marker} needs a decision`,
      },
    });
    const reviewId = created.body.data.id;

    const context = await createContextForRole(browser, 'admin');
    const page = await context.newPage();
    await page.goto('/admin/manage-review');
    await page.getByPlaceholder(/search reviews/i).fill(marker);
    await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();

    await page.getByTestId(`admin-view-review-${reviewId}`).click();
    const dialog = page.getByRole('dialog', { name: /review details/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Approved' }).click();
    await expect(page.getByText('Review approved')).toBeVisible();

    const admin = await apiLogin('admin');
    const check = await apiRequest(api, 'get', `/agency/reviews/${reviewId}`, {
      token: admin.token,
    });
    expect(check.body.data.status).toBe('approved');

    await apiRequest(api, 'delete', `/agency/reviews/${reviewId}`, { token: admin.token });
    await context.close();
    await deleteCustomer(api, customer.id);
    await api.dispose();
  });

  test('signed-in user can save and remove a favourite', async ({ browser }) => {
    const context = await createContextForRole(browser, 'user');
    const page = await context.newPage();
    await page.goto('/popular-list');

    const card = page.locator('article').filter({ hasText: SEED.tech }).first();
    // The listing may already be saved from an earlier run; start from "not saved".
    const remove = card.getByRole('button', { name: 'Remove from favourites' });
    if (await remove.isVisible()) {
      await remove.click();
      await expect(page.getByText('Removed from favourites')).toBeVisible();
    }
    await card.getByRole('button', { name: 'Save to favourites' }).click();
    await expect(page.getByText('Saved to favourites')).toBeVisible();

    await page.goto('/user/favourite-companies');
    await expect(page.getByRole('heading', { name: SEED.tech })).toBeVisible();

    page.on('dialog', (d) => d.accept());
    await page
      .locator('article')
      .filter({ hasText: SEED.tech })
      .getByRole('button', { name: 'Remove' })
      .click();
    await expect(page.getByText('Removed from favourites')).toBeVisible();
    await context.close();
  });

  test('a returning customer signs in with a one-time code from the single front door', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill('user@yellowbook.local');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Development returns the code in the response so no inbox is needed.
    const hint = page.getByText(/dev code:/i);
    await expect(hint).toBeVisible();
    const code = ((await hint.textContent()) ?? '').match(/\d{6}/)?.[0];
    expect(code).toBeTruthy();

    await page.getByLabel('6-digit code').fill(code!);
    await page.getByRole('button', { name: 'Verify and continue' }).click();

    await expect(page).toHaveURL(/\/user\/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('a new visitor creates a customer account from the same form', async ({ page }) => {
    const email = `e2e-new-${Date.now()}@example.com`;

    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Continue' }).click();

    // An unknown email turns the form into sign-up rather than an error.
    await expect(page.getByLabel('Your name')).toBeVisible();
    await page.getByLabel('Your name').fill('E2E Newcomer');
    await page.getByLabel('Choose a password').fill('E2eNewcomerPass1!');
    await page.getByRole('button', { name: 'Create your account' }).click();

    await expect(page).toHaveURL(/\/user\/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome back, e2e newcomer/i })).toBeVisible();

    const api = await request.newContext();
    const admin = await apiLogin('admin');
    const found = await apiRequest(
      api,
      'get',
      `/users?search=${encodeURIComponent(email)}&limit=1`,
      {
        token: admin.token,
      },
    );
    expect(found.body.data[0].email).toBe(email);
    await apiRequest(api, 'delete', `/users/${found.body.data[0].id}`, { token: admin.token });
    await api.dispose();
  });

  test('the password rules are stated once and enforced', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.getByLabel('Email address').fill(`e2e-weak-${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Your name').fill('Weak Password');
    await page.getByLabel('Choose a password').fill('password');
    await page.getByRole('button', { name: 'Create your account' }).click();
    await expect(page.getByRole('alert')).toContainText(/at least 12 characters/i);
  });

  test('signing in resumes the review the visitor came to write', async ({ page }) => {
    const api = await request.newContext();
    const listings = await apiRequest(api, 'get', '/listings?limit=10');
    const target = listings.body.data.listings.find((l: any) => l.name === SEED.travel);
    const email = `e2e-resume-${Date.now()}@example.com`;

    await page.goto(`/agency?id=${target.id}&slug=${target.slug}`);
    await page.getByRole('button', { name: 'Write a review' }).click();

    const dialog = page.getByRole('dialog', { name: /sign in to yellow book/i });
    await dialog.getByLabel('Email address').fill(email);
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await dialog.getByLabel('Your name').fill('Resumed Reviewer');
    await dialog.getByLabel('Choose a password').fill('ResumedReviewer1!');
    await dialog.getByRole('button', { name: 'Create your account' }).click();

    // Straight into the composer, on the same page, without asking again.
    await expect(page.getByRole('dialog', { name: /write a review/i })).toBeVisible();

    const admin = await apiLogin('admin');
    const found = await apiRequest(
      api,
      'get',
      `/users?search=${encodeURIComponent(email)}&limit=1`,
      {
        token: admin.token,
      },
    );
    await apiRequest(api, 'delete', `/users/${found.body.data[0].id}`, { token: admin.token });
    await api.dispose();
  });

  test('a customer may review a company once, and is sent to their review instead', async ({
    browser,
  }) => {
    const api = await request.newContext();
    const user = await apiLogin('user');
    const listings = await apiRequest(api, 'get', '/listings?limit=10');
    const target = listings.body.data.listings.find((l: any) => l.name === SEED.tech);

    const context = await createContextForRole(browser, 'user');
    const page = await context.newPage();
    await page.goto(`/agency?id=${target.id}&slug=${target.slug}`);

    // The seed user already reviewed this company.
    await expect(page.getByRole('heading', { name: /you reviewed this company/i })).toBeVisible();
    await page.getByRole('button', { name: 'Edit your review' }).click();
    await expect(page).toHaveURL(/\/user\/my-reviews/);

    const second = await apiRequest(api, 'post', '/agency/reviews', {
      token: user.token,
      data: { companyId: target.id, rating: 1, content: 'Trying to review twice' },
      expectStatus: [409],
    });
    expect(second.body.message).toMatch(/already reviewed/i);

    await context.close();
    await api.dispose();
  });

  test('the contact form reaches an administrator', async ({ page }) => {
    const marker = `Contact probe ${Date.now()}`;
    await page.goto('/contact');
    await page.getByLabel('Your name').fill('Concerned Visitor');
    await page.getByLabel('Your email').fill('visitor@example.com');
    await page.getByLabel('Message').fill(`${marker} — my review disappeared, can you check?`);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('heading', { name: /message received/i })).toBeVisible();

    const api = await request.newContext();
    const admin = await apiLogin('admin');
    const queue = await apiRequest(api, 'get', '/support/messages?limit=5', { token: admin.token });
    const received = queue.body.data.find((m: any) => m.message.includes(marker));
    expect(received).toBeTruthy();

    // Close it out the way an administrator would.
    const handled = await apiRequest(api, 'put', `/support/messages/${received.id}`, {
      token: admin.token,
      data: { status: 'handled' },
    });
    expect(handled.body.data.status).toBe('handled');
    await api.dispose();
  });

  test('changing a password really changes it', async ({ browser }) => {
    const api = await request.newContext();
    const admin = await apiLogin('admin');
    const email = `e2e-pw-${Date.now()}@example.com`;
    const created = await apiRequest(api, 'post', '/users', {
      token: admin.token,
      data: { name: 'Password Tester', email, password: 'FirstPassword123!', verified: true },
    });
    const userId = created.body.data.id;
    const login = await apiRequest(api, 'post', '/auth/login', {
      data: { email, password: 'FirstPassword123!' },
    });

    const context = await contextForSession(browser, login.body.data.token, login.body.data.user);
    const page = await context.newPage();
    await page.goto('/user/my-profile');
    await page.getByLabel('Current password').fill('FirstPassword123!');
    await page.getByLabel('New password', { exact: true }).fill('SecondPassword123!');
    await page.getByLabel('Confirm new password').fill('SecondPassword123!');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText(/password updated/i)).toBeVisible();

    await apiRequest(api, 'post', '/auth/login', {
      data: { email, password: 'FirstPassword123!' },
      expectStatus: [401],
    });
    await apiRequest(api, 'post', '/auth/login', {
      data: { email, password: 'SecondPassword123!' },
    });

    await context.close();
    await apiRequest(api, 'delete', `/users/${userId}`, { token: admin.token });
    await api.dispose();
  });

  test('the reset password page validates the form and rejects a bad token', async ({ page }) => {
    await page.goto('/auth/reset-password?token=not-a-real-token');
    await page.getByPlaceholder('New password', { exact: true }).fill('BrandNewReset123!');
    await page.getByPlaceholder('Confirm new password').fill('Different123!');
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByRole('alert')).toHaveText('Passwords do not match');

    await page.getByPlaceholder('Confirm new password').fill('BrandNewReset123!');
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByRole('alert')).toHaveText(/invalid or expired reset token/i);
    await expect(page).toHaveURL(/\/auth\/reset-password/);
  });
});
