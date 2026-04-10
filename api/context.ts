import type { Layer } from "effect";
import type { DbService } from "../db/services.js";
import type { BotService } from "../bot/services.js";

let appLayer: Layer.Layer<DbService | BotService> | null = null;

export function setAppLayer(
  layer: Layer.Layer<DbService | BotService>,
): void {
  appLayer = layer;
}

export function getAppLayer(): Layer.Layer<DbService | BotService> {
  if (!appLayer) throw new Error("App layer not configured. Call setAppLayer() first.");
  return appLayer;
}
