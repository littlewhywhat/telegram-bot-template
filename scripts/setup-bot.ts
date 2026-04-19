import { Effect as Fx, pipe } from 'effect';
import { botSettings } from '../bot-settings.js';
import {
  syncSetting,
  TelegramApiError,
  uploadProfilePhoto,
} from './telegram-api.js';

const botName =
  process.env.ENVIRONMENT_NAME && process.env.ENVIRONMENT_NAME !== 'production'
    ? `${botSettings.name} [${process.env.ENVIRONMENT_NAME.toLowerCase()}]`
    : botSettings.name;

const program = pipe(
  Fx.Do,
  Fx.flatMap(() =>
    Fx.if(
      !!process.env.BOT_TOKEN &&
        !!process.env.WEBHOOK_URL &&
        !!process.env.WEBHOOK_SECRET,
      {
        onTrue: () =>
          Fx.succeed({
            token: process.env.BOT_TOKEN as string,
            url: process.env.WEBHOOK_URL as string,
            secret: process.env.WEBHOOK_SECRET as string,
          }),
        onFalse: () =>
          Fx.fail(
            new TelegramApiError({
              method: 'env',
              description: 'Required: BOT_TOKEN, WEBHOOK_URL, WEBHOOK_SECRET',
            }),
          ),
      },
    ),
  ),
  Fx.flatMap((env) =>
    pipe(
      syncSetting({
        token: env.token,
        label: 'Webhook',
        get: 'getWebhookInfo',
        set: 'setWebhook',
        desired: `${env.url}/api/webhook`,
        body: { url: `${env.url}/api/webhook`, secret_token: env.secret },
        extract: (r: unknown) => (r as { url: string }).url,
      }),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Bot name',
          get: 'getMyName',
          set: 'setMyName',
          desired: botName,
          body: { name: botName },
          extract: (r: unknown) => (r as { name: string }).name,
        }),
      ),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Bot description',
          get: 'getMyDescription',
          set: 'setMyDescription',
          desired: botSettings.description,
          body: { description: botSettings.description },
          extract: (r: unknown) => (r as { description: string }).description,
        }),
      ),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Bot short description',
          get: 'getMyShortDescription',
          set: 'setMyShortDescription',
          desired: botSettings.shortDescription,
          body: { short_description: botSettings.shortDescription },
          extract: (r: unknown) =>
            (r as { short_description: string }).short_description,
        }),
      ),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Commands',
          get: 'getMyCommands',
          set: 'setMyCommands',
          desired: botSettings.commands,
          body: { commands: botSettings.commands },
        }),
      ),
      Fx.flatMap(() => {
        const desired = botSettings.menuButton(env.url);
        return syncSetting({
          token: env.token,
          label: 'Menu button',
          get: 'getChatMenuButton',
          set: 'setChatMenuButton',
          desired,
          body: { menu_button: desired },
        });
      }),
      Fx.flatMap(() =>
        Fx.when(
          Fx.suspend(() =>
            uploadProfilePhoto(env.token, botSettings.profilePhoto as string),
          ),
          () => botSettings.profilePhoto != null,
        ),
      ),
      Fx.flatMap(() =>
        Fx.when(
          Fx.suspend(() => {
            const { rights, for_channels } =
              botSettings.defaultAdministratorRights as NonNullable<
                typeof botSettings.defaultAdministratorRights
              >;
            return syncSetting({
              token: env.token,
              label: 'Default administrator rights',
              get: 'getMyDefaultAdministratorRights',
              set: 'setMyDefaultAdministratorRights',
              desired: rights,
              body: { rights, for_channels },
            });
          }),
          () => botSettings.defaultAdministratorRights != null,
        ),
      ),
      Fx.flatMap(() => Fx.log('Bot setup complete')),
    ),
  ),
);

Fx.runPromise(program).catch((err) => {
  console.error(err);
  process.exit(1);
});
