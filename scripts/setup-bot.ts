import * as fs from 'node:fs';
import * as path from 'node:path';
import { botSettings } from '../bot-settings.js';

const token = process.env.BOT_TOKEN;
const url = process.env.WEBHOOK_URL;
const secret = process.env.WEBHOOK_SECRET;

if (!token || !url || !secret) {
  console.error('Required: BOT_TOKEN, WEBHOOK_URL, WEBHOOK_SECRET');
  process.exit(1);
}

async function callApi(method: string, body?: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error(`${method} failed:`, json.description);
    process.exit(1);
  }
  return json.result;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
  for (const key of keys) {
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }
  return true;
}

async function setIfChanged<T>(
  label: string,
  getCurrent: () => Promise<T>,
  desired: T,
  apply: () => Promise<unknown>,
  compare: (current: T, desired: T) => boolean = deepEqual,
) {
  const current = await getCurrent();
  if (compare(current, desired)) {
    console.log(`${label} — unchanged, skipped`);
    return;
  }
  await apply();
  console.log(`${label} — updated`);
}

const webhookUrl = `${url}/api/webhook`;
const webhookInfo = await callApi('getWebhookInfo');
if (webhookInfo.url === webhookUrl) {
  console.log('Webhook — unchanged, skipped');
} else {
  await callApi('setWebhook', { url: webhookUrl, secret_token: secret });
  console.log('Webhook — updated');
}

await setIfChanged(
  'Bot name',
  async () => (await callApi('getMyName')).name as string,
  botSettings.name,
  () => callApi('setMyName', { name: botSettings.name }),
);

await setIfChanged(
  'Bot description',
  async () => (await callApi('getMyDescription')).description as string,
  botSettings.description,
  () => callApi('setMyDescription', { description: botSettings.description }),
);

await setIfChanged(
  'Bot short description',
  async () =>
    (await callApi('getMyShortDescription')).short_description as string,
  botSettings.shortDescription,
  () =>
    callApi('setMyShortDescription', {
      short_description: botSettings.shortDescription,
    }),
);

await setIfChanged(
  'Commands',
  () => callApi('getMyCommands'),
  botSettings.commands,
  () => callApi('setMyCommands', { commands: botSettings.commands }),
);

const desiredMenuButton = botSettings.menuButton(url);
await setIfChanged(
  'Menu button',
  () => callApi('getChatMenuButton'),
  desiredMenuButton,
  () => callApi('setChatMenuButton', { menu_button: desiredMenuButton }),
);

if (botSettings.profilePhoto) {
  const resolved = path.resolve(botSettings.profilePhoto);
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

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setMyProfilePhoto`,
    { method: 'POST', body: form },
  );
  const json = await res.json();
  if (!json.ok) {
    console.error('setMyProfilePhoto failed:', json.description);
    process.exit(1);
  }
  console.log('Profile photo — updated');
}

if (botSettings.defaultAdministratorRights) {
  const { rights, for_channels } = botSettings.defaultAdministratorRights;
  await setIfChanged(
    'Default administrator rights',
    () => callApi('getMyDefaultAdministratorRights'),
    rights,
    () => callApi('setMyDefaultAdministratorRights', { rights, for_channels }),
  );
}

console.log('Bot setup complete');
