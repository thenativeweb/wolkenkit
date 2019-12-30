#!/usr/bin/env node

import { buildImages } from '../../docker/buildImages';
import { errors } from '../../lib/common/errors';
import { flaschenpost } from 'flaschenpost';
import path from 'path';
import shell from 'shelljs';
import { mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  const logger = flaschenpost.getLogger();

  try {
    const { code, stdout, stderr } = shell.exec('npx roboter build', { cwd: path.join(__dirname, '..', '..') });

    if (code !== 0) {
      throw new errors.CompilationFailed('Failed to build wolkenkit.', { data: { stdout, stderr }});
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }

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
