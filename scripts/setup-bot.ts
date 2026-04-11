export {};

const token = process.env.BOT_TOKEN;
const url = process.env.WEBHOOK_URL;
const secret = process.env.WEBHOOK_SECRET;

if (!token || !url || !secret) {
  console.error('Required: BOT_TOKEN, WEBHOOK_URL, WEBHOOK_SECRET');
  process.exit(1);
}

const BOT_NAME = 'My Bot';
const BOT_DESCRIPTION =
  'A friendly bot that greets you every morning with an inspiring quote.';
const BOT_SHORT_DESCRIPTION = 'Daily inspiration & greetings';
const COMMANDS = [{ command: 'start', description: 'Start the bot' }];
const MENU_BUTTON = {
  type: 'web_app' as const,
  text: 'Open App',
  web_app: { url },
};

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

await callApi('setMyName', { name: BOT_NAME });
console.log('Bot name set');

await callApi('setMyDescription', { description: BOT_DESCRIPTION });
console.log('Bot description set');

await callApi('setMyShortDescription', {
  short_description: BOT_SHORT_DESCRIPTION,
});
console.log('Bot short description set');

await callApi('setMyCommands', { commands: COMMANDS });
console.log('Commands set');

await callApi('setChatMenuButton', { menu_button: MENU_BUTTON });
console.log('Menu button set');

console.log('Bot setup complete');
