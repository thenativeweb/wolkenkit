#!/usr/bin/env node

import { buildImages } from '../../docker/buildImages';
import { flaschenpost } from 'flaschenpost';
import { mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  const logger = flaschenpost.getLogger();

  try {
    await buildImages();

    await Promise.all([
      mariaDb.start(),
      minio.start(),
      mongoDb.start(),
      mySql.start(),
      postgres.start(),
      redis.start(),
      sqlServer.start()
    ]);
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
