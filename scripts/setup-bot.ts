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

async function callApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error(`${method} failed:`, json.description);
    process.exit(1);
  }
  return json;
}

async function uploadProfilePhoto(filePath: string) {
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

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setMyProfilePhoto`,
    { method: 'POST', body: form },
  );
  const json = await res.json();
  if (!json.ok) {
    console.error('setMyProfilePhoto failed:', json.description);
    process.exit(1);
  }
  return json;
}

await callApi('setWebhook', {
  url: `${url}/api/webhook`,
  secret_token: secret,
});
console.log('Webhook set');

await callApi('setMyName', { name: botSettings.name });
console.log('Bot name set');

await callApi('setMyDescription', { description: botSettings.description });
console.log('Bot description set');

await callApi('setMyShortDescription', {
  short_description: botSettings.shortDescription,
});
console.log('Bot short description set');

await callApi('setMyCommands', { commands: botSettings.commands });
console.log('Commands set');

await callApi('setChatMenuButton', {
  menu_button: botSettings.menuButton(url),
});
console.log('Menu button set');

if (botSettings.profilePhoto) {
  await uploadProfilePhoto(botSettings.profilePhoto);
  console.log('Profile photo set');
}

if (botSettings.defaultAdministratorRights) {
  await callApi('setMyDefaultAdministratorRights', {
    rights: botSettings.defaultAdministratorRights.rights,
    for_channels: botSettings.defaultAdministratorRights.for_channels,
  });
  console.log('Default administrator rights set');
}

console.log('Bot setup complete');
