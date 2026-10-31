import { createApp } from './app.js';
import {
  connectDatabase,
  disconnectDatabase,
} from './config/database.js';
import { env } from './config/env.js';
import { initFirebase } from './config/firebase.js';
import { settleDueMarkets } from './services/bet.service.js';

async function bootstrap() {
  initFirebase();
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`Rano API listening on http://localhost:${env.port}`);
    console.log(`Health: http://localhost:${env.port}/api/v1/health`);
  });

  let settling = false;
  const runMarketSync = async () => {
    if (settling) return;
    settling = true;
    try {
      await settleDueMarkets();
    } catch (error) {
      console.error('Market sync failed', error);
    } finally {
      settling = false;
    }
  };
  void runMarketSync();
  const marketSyncTimer = setInterval(() => { void runMarketSync(); }, 60_000);

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    clearInterval(marketSyncTimer);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
