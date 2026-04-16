import { createHmac } from 'node:crypto';

export interface InitDataUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface SignInitDataOptions {
  user: InitDataUser;
  botToken: string;
  authDate?: number;
  queryId?: string;
}

export function signInitData(options: SignInitDataOptions): string {
  const authDate = options.authDate ?? Math.floor(Date.now() / 1000);
  const queryId = options.queryId ?? 'AAHdF6IQAAAAAN0XohDhrOrc';

  const params = new URLSearchParams();
  params.set('query_id', queryId);
  params.set('user', JSON.stringify(options.user));
  params.set('auth_date', String(authDate));

  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries
    .map(([key, val]) => `${key}=${val}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(options.botToken)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  params.set('hash', hash);
  return params.toString();
}
