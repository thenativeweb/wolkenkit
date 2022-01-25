#!/usr/bin/env node

import { buildImages } from '../../docker/buildImages';
import { flaschenpost } from 'flaschenpost';
import path from 'path';
import shell from 'shelljs';
import { TestPreScript } from 'roboter';
import { azurite, mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';
import * as errors from '../../lib/common/errors';

const preScript: TestPreScript = async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    const { code, stdout, stderr } = shell.exec('npx roboter build', { cwd: path.join(__dirname, '..', '..') });

    if (code !== 0) {
      throw new errors.CompilationFailed({ message: 'Failed to build wolkenkit.', data: { stdout, stderr }});
    }
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { err: ex });
    throw ex;
  }

  try {
    await buildImages();

    await Promise.all([
      azurite.start(),
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
