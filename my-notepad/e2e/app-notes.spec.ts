import { test, expect } from '@playwright/test';

test.describe('App – Notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('can switch to Notes tab', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    await expect(page.getByRole('tab', { name: /notes/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByPlaceholder(/start writing/i)).toBeVisible();
  });

  test('Notes tab shows textarea and Process with AI', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    await expect(page.getByPlaceholder(/start writing/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /process full text and get ai insights/i })).toBeVisible();
  });

  test('typing in notes updates content', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    const textarea = page.getByPlaceholder(/start writing/i);
    await textarea.fill('My E2E note content');
    await expect(textarea).toHaveValue('My E2E note content');
  });

  test('Process with AI button is disabled when notes empty', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    const textarea = page.getByPlaceholder(/start writing/i);
    await textarea.clear();
    const processBtn = page.getByRole('button', { name: /process full text and get ai insights/i });
    await expect(processBtn).toBeDisabled();
  });

  test('Process with AI button is enabled when notes have content', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    await page.getByPlaceholder(/start writing/i).fill('Some note text');
    const processBtn = page.getByRole('button', { name: /process full text and get ai insights/i });
    await expect(processBtn).toBeEnabled();
  });

  test('AI insights section is visible', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    await expect(page.getByText('AI insights')).toBeVisible();
  });
});
