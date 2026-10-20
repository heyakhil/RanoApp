import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';
import routes from './routes/index.js';

/**
 * Builds the Express application (no listen — easier to test).
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, callback) => {
        // React Native and same-machine tools often send no Origin header
        // Any origin is allowed outside production so local dev ports/hosts just work
        if (
          !origin ||
          !env.isProduction ||
          env.corsOrigins.length === 0 ||
          env.corsOrigins.includes(origin)
        ) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      exposedHeaders: ['X-Access-Token'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
