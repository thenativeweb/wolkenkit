#!/usr/bin/env node

import { flaschenpost } from 'flaschenpost';
import { mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  const logger = flaschenpost.getLogger();

  try {
    await Promise.all([
      mariaDb.stop(),
      minio.stop(),
      mongoDb.stop(),
      mySql.stop(),
      postgres.stop(),
      redis.stop(),
      sqlServer.stop()
    ]);
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
