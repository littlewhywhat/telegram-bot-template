import { Effect as Fx, pipe } from 'effect';
import { botSettings } from '../bot-settings.js';
import {
  syncSetting,
  TelegramApiError,
  uploadProfilePhoto,
} from './telegram-api.js';

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
        getMethod: 'getWebhookInfo',
        extractCurrent: (r: unknown) => (r as { url: string }).url,
        desired: `${env.url}/api/webhook`,
        setMethod: 'setWebhook',
        setBody: {
          url: `${env.url}/api/webhook`,
          secret_token: env.secret,
        },
      }),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Bot name',
          getMethod: 'getMyName',
          extractCurrent: (r: unknown) => (r as { name: string }).name,
          desired: botSettings.name,
          setMethod: 'setMyName',
          setBody: { name: botSettings.name },
        }),
      ),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Bot description',
          getMethod: 'getMyDescription',
          extractCurrent: (r: unknown) =>
            (r as { description: string }).description,
          desired: botSettings.description,
          setMethod: 'setMyDescription',
          setBody: { description: botSettings.description },
        }),
      ),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Bot short description',
          getMethod: 'getMyShortDescription',
          extractCurrent: (r: unknown) =>
            (r as { short_description: string }).short_description,
          desired: botSettings.shortDescription,
          setMethod: 'setMyShortDescription',
          setBody: { short_description: botSettings.shortDescription },
        }),
      ),
      Fx.flatMap(() =>
        syncSetting({
          token: env.token,
          label: 'Commands',
          getMethod: 'getMyCommands',
          extractCurrent: (r: unknown) => r,
          desired: botSettings.commands,
          setMethod: 'setMyCommands',
          setBody: { commands: botSettings.commands },
        }),
      ),
      Fx.flatMap(() => {
        const desired = botSettings.menuButton(env.url);
        return syncSetting({
          token: env.token,
          label: 'Menu button',
          getMethod: 'getChatMenuButton',
          extractCurrent: (r: unknown) => r,
          desired,
          setMethod: 'setChatMenuButton',
          setBody: { menu_button: desired },
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
              getMethod: 'getMyDefaultAdministratorRights',
              extractCurrent: (r: unknown) => r,
              desired: rights,
              setMethod: 'setMyDefaultAdministratorRights',
              setBody: { rights, for_channels },
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
