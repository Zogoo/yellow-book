import { expect, request, test } from '@playwright/test';

import { apiRequest, pinLocale, SEED } from './helpers';

/**
 * The service is built for Mongolia: it opens in Mongolian, English is one
 * click away, and the parts a Mongolian visitor actually uses — Cyrillic
 * search, districts, a phone number, a Facebook page — work in both languages.
 */
test.describe('Mongolian localisation', () => {
  test('the site opens in Mongolian and the switcher sticks', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Итгэлтэй үйлчилгээг/ })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'mn');

    await page.getByRole('button', { name: 'Хэл' }).click();
    await page.getByRole('menuitemradio', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: /Trusted help/i })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // The choice is remembered on this device.
    await page.reload();
    await expect(page.getByRole('heading', { name: /Trusted help/i })).toBeVisible();

    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('menuitemradio', { name: 'Монгол' }).click();
    await expect(page.getByRole('heading', { name: /Итгэлтэй үйлчилгээг/ })).toBeVisible();
  });

  test('categories carry Mongolian names and counts, and the grid links to the full list', async ({
    page,
  }) => {
    await pinLocale(page, 'mn');
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Гоо сайхан' })).toBeVisible();
    // The old dead-end "More" tile is gone; a real link replaces it.
    await expect(page.getByRole('button', { name: /^More$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Дэлгэрэнгүй$/ })).toHaveCount(0);

    await page.getByRole('link', { name: /Бүх ангилал харах/ }).click();
    await expect(page).toHaveURL(/\/catagory/);
    await expect(page.getByRole('button', { name: 'Мэдээллийн технологи' })).toBeVisible();
  });

  test('Cyrillic search finds a company whatever the case', async ({ page }) => {
    await pinLocale(page, 'mn');
    await page.goto('/catagory?q=ГОО%20УРЛАН');
    await expect(page.getByRole('heading', { name: SEED.salon })).toBeVisible();
  });

  test('the district filter narrows the list', async ({ page }) => {
    await pinLocale(page, 'mn');
    // Every seeded company sits in Ulaanbaatar, so this search returns them all.
    await page.goto(
      '/catagory?q=%D0%A3%D0%BB%D0%B0%D0%B0%D0%BD%D0%B1%D0%B0%D0%B0%D1%82%D0%B0%D1%80',
    );
    await expect(page.getByRole('heading', { name: SEED.vet })).toBeVisible();

    await page.getByLabel('Дүүрэг').selectOption('Сүхбаатар');
    await expect(page.getByRole('heading', { name: SEED.salon })).toBeVisible();
    await expect(page.getByRole('heading', { name: SEED.vet })).toHaveCount(0);
  });

  test('a company page offers the phone number and the Facebook page', async ({ page }) => {
    const api = await request.newContext();
    const listings = await apiRequest(api, 'get', '/listings?limit=10');
    const salon = listings.body.data.listings.find((l: any) => l.name === SEED.salon);
    await api.dispose();

    await pinLocale(page, 'mn');
    await page.goto(`/agency?id=${salon.id}&slug=${salon.slug}`);

    const call = page.getByRole('link', { name: /Залгах/ }).first();
    await expect(call).toHaveAttribute('href', /^tel:\+?976/);
    await expect(page.getByRole('link', { name: /Facebook/ }).first()).toHaveAttribute(
      'href',
      /facebook\.com/,
    );
  });

  test('the API answers in the language the app asks for', async () => {
    const api = await request.newContext();
    const mn = await apiRequest(api, 'get', '/listings?limit=4');
    const en = await request.newContext({ extraHTTPHeaders: { 'X-Locale': 'en' } });
    const english = await apiRequest(en, 'get', '/listings?limit=4');

    const mnCategories = mn.body.data.listings.map((l: any) => l.category);
    const enCategories = english.body.data.listings.map((l: any) => l.category);
    expect(mnCategories).toContain(SEED.beautyCategory.mn);
    expect(enCategories).toContain(SEED.beautyCategory.en);

    await api.dispose();
    await en.dispose();
  });
});
