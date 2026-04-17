import { expect, test } from './fixtures/telegram';
import { resetDb, seedUser } from './helpers/db';

test.beforeEach(async () => {
  await resetDb();
});

test('greets known ready user by name', async ({ page }) => {
  await seedUser({ chatId: 555, name: 'Alice', state: 'ready' });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Hello, Alice!' }),
  ).toBeVisible();
});

test('greets stranger when user has no stored name', async ({ page }) => {
  await seedUser({ chatId: 555, name: null, state: 'awaiting_name' });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Hello, stranger!' }),
  ).toBeVisible();
});
