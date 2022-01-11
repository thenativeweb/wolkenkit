#!/usr/bin/env node

import { buildImages } from '../../docker/buildImages';
import { flaschenpost } from 'flaschenpost';
import { TestPreScript } from 'roboter';
import { mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';

const preScript: TestPreScript = async (): Promise<void> => {
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
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { err: ex });
    throw ex;
  }
};

export default preScript;
