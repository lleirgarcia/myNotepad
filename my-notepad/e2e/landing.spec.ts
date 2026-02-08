import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows app name and navigates to app', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /noted/i }).first()).toBeVisible();
    const appLink = page.getByRole('link', { name: /try noted|open app/i }).first();
    await expect(appLink).toBeVisible();
    await appLink.click();
    await expect(page).toHaveURL(/\/app/);
  });

  test('has pricing link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible();
    await page.getByRole('link', { name: /pricing/i }).click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('has log in button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });
});
