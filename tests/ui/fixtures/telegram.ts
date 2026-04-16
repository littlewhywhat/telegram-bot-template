import { test as base, expect } from '@playwright/test';
import {
  type InitDataUser,
  signInitData,
} from '../../helpers/sign-init-data.js';

export interface TelegramFixtures {
  telegramUser: InitDataUser;
}

export const test = base.extend<TelegramFixtures>({
  telegramUser: [{ id: 555, first_name: 'Alice' }, { option: true }],
  page: async ({ page, telegramUser }, use) => {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) throw new Error('BOT_TOKEN not set in test env');

    const initData = signInitData({ user: telegramUser, botToken });

    await page.route('**/telegram-web-app.js', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '',
      }),
    );

    await page.addInitScript(
      ({ initData, user }) => {
        const webApp = {
          initData,
          initDataUnsafe: { user },
          ready: () => {},
          expand: () => {},
          close: () => {},
          themeParams: {},
          colorScheme: 'light',
          MainButton: {
            show: () => {},
            hide: () => {},
            onClick: () => {},
            offClick: () => {},
            setText: () => {},
            setParams: () => {},
          },
          BackButton: {
            show: () => {},
            hide: () => {},
            onClick: () => {},
            offClick: () => {},
          },
        };
        (
          window as unknown as { Telegram: { WebApp: typeof webApp } }
        ).Telegram = { WebApp: webApp };
      },
      { initData, user: telegramUser },
    );

    await use(page);
  },
});

export { expect };
