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

console.log('Bot setup complete');
