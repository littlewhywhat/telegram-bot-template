import { Data } from 'effect';

export class DbError extends Data.TaggedError('DbError')<{
  cause: unknown;
}> {}

export class BotError extends Data.TaggedError('BotError')<{
  cause: unknown;
}> {}

export class ConfigError extends Data.TaggedError('ConfigError')<{
  message: string;
}> {}

export class AuthError extends Data.TaggedError('AuthError')<{
  message: string;
}> {}

export type AppError = DbError | BotError | ConfigError | AuthError;
