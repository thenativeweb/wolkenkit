#!/usr/bin/env node

import { flaschenpost } from 'flaschenpost';
import { TestPostScript } from 'roboter';
import { mariaDb, minio, mongoDb, mySql, postgres, postgresSsl, redis, sqlServer } from '../shared/containers';

const postScript: TestPostScript = async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    await Promise.all([
      mariaDb.stop(),
      minio.stop(),
      mongoDb.stop(),
      mySql.stop(),
      postgres.stop(),
      postgresSsl.stop(),
      redis.stop(),
      sqlServer.stop()
    ]);
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { err: ex });
    throw ex;
  }
};

export default postScript;
