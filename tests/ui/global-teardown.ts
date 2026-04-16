import { Effect as Fx } from 'effect';
import type { MongoClient } from 'mongodb';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import type { createTestRuntime } from '../helpers/test-runtime.js';

export default async function globalTeardown() {
  const state = globalThis as unknown as {
    __e2e__?: {
      server: { close: (cb?: () => void) => void };
      client: MongoClient;
      mongod: MongoMemoryServer;
      runtime: ReturnType<typeof createTestRuntime>;
    };
  };

  const handles = state.__e2e__;
  if (!handles) return;

  await new Promise<void>((resolve) => handles.server.close(() => resolve()));
  await handles.client.close();
  await handles.mongod.stop();
  await Fx.runPromise(handles.runtime.disposeEffect);
}
