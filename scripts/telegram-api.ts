import * as fs from 'node:fs';
import * as path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { Data, Effect as Fx, pipe } from 'effect';

export class TelegramApiError extends Data.TaggedError('TelegramApiError')<{
  method: string;
  description: string;
}> {}

export const callApi = (
  token: string,
  method: string,
  body?: Record<string, unknown>,
): Fx.Effect<unknown, TelegramApiError> =>
  pipe(
    Fx.tryPromise({
      try: () =>
        fetch(`https://api.telegram.org/bot${token}/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body ?? {}),
        }).then((res) => res.json()),
      catch: () =>
        new TelegramApiError({ method, description: 'fetch failed' }),
    }),
    Fx.flatMap((json: { ok: boolean; result: unknown; description?: string }) =>
      Fx.if(json.ok, {
        onTrue: () => Fx.succeed(json.result),
        onFalse: () =>
          Fx.fail(
            new TelegramApiError({
              method,
              description: json.description ?? 'unknown error',
            }),
          ),
      }),
    ),
  );

export const syncSetting = ({
  token,
  label,
  get,
  set,
  desired,
  body,
  extract = (r: unknown) => r,
}: {
  token: string;
  label: string;
  get: string;
  set: string;
  desired: unknown;
  body: Record<string, unknown>;
  extract?: (result: unknown) => unknown;
}): Fx.Effect<void, TelegramApiError> =>
  pipe(
    callApi(token, get),
    Fx.map(extract),
    Fx.flatMap((current) =>
      Fx.if(isDeepStrictEqual(current, desired), {
        onTrue: () => Fx.log(`${label} — unchanged, skipped`),
        onFalse: () =>
          pipe(
            callApi(token, set, body),
            Fx.flatMap(() => Fx.log(`${label} — updated`)),
          ),
      }),
    ),
  );

export const uploadProfilePhoto = (
  token: string,
  filePath: string,
): Fx.Effect<void, TelegramApiError> =>
  pipe(
    Fx.sync(() => {
      const resolved = path.resolve(filePath);
      const fileBuffer = fs.readFileSync(resolved);
      const fileName = path.basename(resolved);
      const form = new FormData();
      form.append(
        'photo',
        JSON.stringify({ type: 'static', photo: 'attach://photo_file' }),
      );
      form.append(
        'photo_file',
        new Blob([fileBuffer], { type: 'image/jpeg' }),
        fileName,
      );
      return form;
    }),
    Fx.flatMap((form) =>
      Fx.tryPromise({
        try: () =>
          fetch(`https://api.telegram.org/bot${token}/setMyProfilePhoto`, {
            method: 'POST',
            body: form,
          }).then((res) => res.json()),
        catch: () =>
          new TelegramApiError({
            method: 'setMyProfilePhoto',
            description: 'fetch failed',
          }),
      }),
    ),
    Fx.flatMap((json: { ok: boolean; description?: string }) =>
      Fx.if(json.ok, {
        onTrue: () => Fx.log('Profile photo — updated'),
        onFalse: () =>
          Fx.fail(
            new TelegramApiError({
              method: 'setMyProfilePhoto',
              description: json.description ?? 'unknown error',
            }),
          ),
      }),
    ),
  );
