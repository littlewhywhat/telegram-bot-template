import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import type { BotWorld } from "./world.js";

Before(async function (this: BotWorld) {
  await this.startDb();
  this.sent = [];
  this.mockedHour = null;
});

After(async function (this: BotWorld) {
  await this.stopDb();
});
