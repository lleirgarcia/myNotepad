import { test, expect } from '@playwright/test';

test.describe('App – Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('shows Tasks tab and add-task form', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /tasks/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /tasks/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByPlaceholder(/add a task/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add task/i })).toBeVisible();
  });

  test('adds a task and shows it in the list', async ({ page }) => {
    const input = page.getByPlaceholder(/add a task/i);
    await input.fill('E2E test task');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('E2E test task')).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('does not add empty task', async ({ page }) => {
    const unique = 'E2E empty submit should not appear';
    await expect(page.getByText(unique)).not.toBeVisible();
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText(unique)).not.toBeVisible();
  });

  test('filter All is selected by default', async ({ page }) => {
    await expect(page.getByRole('button', { name: /show all active tasks/i })).toHaveAttribute('aria-pressed', 'true');
  });

  test('can filter by Done and see completed section', async ({ page }) => {
    const input = page.getByPlaceholder(/add a task/i);
    await input.fill('Task to complete');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Task to complete')).toBeVisible();
    await page.locator('.task-card', { hasText: 'Task to complete' }).getByRole('button', { name: /mark complete/i }).click();
    await expect(page.getByText('Task to complete')).not.toBeVisible();
    await page.getByRole('button', { name: /show completed tasks/i }).click();
    await expect(page.getByText('Task to complete')).toBeVisible();
    await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  });

  test('can delete a task', async ({ page }) => {
    const input = page.getByPlaceholder(/add a task/i);
    await input.fill('Task to delete');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByText('Task to delete')).toBeVisible();
    await page.locator('.task-card', { hasText: 'Task to delete' }).getByRole('button', { name: /delete task/i }).click();
    await expect(page.getByText('Task to delete')).not.toBeVisible();
  });

  test('priority color buttons are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /red priority/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cyan priority/i }).or(page.getByLabel(/cyan priority/i)).first()).toBeVisible();
  });
});
