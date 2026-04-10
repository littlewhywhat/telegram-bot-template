import { Layer } from "effect";
import { handle } from "@hono/node-server/vercel";
import { setAppLayer } from "./context.js";
import { makeDbLayer } from "../db/services.js";
import { makeBotLayer } from "../bot/services.js";
import { createBot } from "../bot/index.js";
import { getDb } from "../db/client.js";
import app from "./app.js";

const db = getDb();
const bot = createBot(process.env.BOT_TOKEN!);
setAppLayer(Layer.merge(makeDbLayer(db), makeBotLayer(bot)));

export default handle(app);
