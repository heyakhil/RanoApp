import { createApp } from './app.js';
import {
  connectDatabase,
  disconnectDatabase,
} from './config/database.js';
import { env } from './config/env.js';
import { initFirebase } from './config/firebase.js';

async function bootstrap() {
  initFirebase();
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`Rano API listening on http://localhost:${env.port}`);
    console.log(`Health: http://localhost:${env.port}/api/v1/health`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
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
