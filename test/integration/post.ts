#!/usr/bin/env node

import { flaschenpost } from 'flaschenpost';
import { TestPostScript } from 'roboter';
import { azurite, mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';

const postScript: TestPostScript = async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    await Promise.all([
      azurite.stop(),
      mariaDb.stop(),
      minio.stop(),
      mongoDb.stop(),
      mySql.stop(),
      postgres.stop(),
      redis.stop(),
      sqlServer.stop()
    ]);
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { err: ex });
    throw ex;
  }
};

export default postScript;
