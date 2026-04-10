export {};

const token = process.env.BOT_TOKEN;
const url = process.env.WEBHOOK_URL;
const secret = process.env.WEBHOOK_SECRET;

if (!token || !url || !secret) {
  console.error("Required: BOT_TOKEN, WEBHOOK_URL, WEBHOOK_SECRET");
  process.exit(1);
}

const endpoint = `https://api.telegram.org/bot${token}/setWebhook`;

const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: `${url}/api/webhook`, secret_token: secret }),
});

const body = await res.json();
if (body.ok) {
  console.log("Webhook set:", body.description);
} else {
  console.error("Failed:", body.description);
  process.exit(1);
}
