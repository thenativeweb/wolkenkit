import { buildImages } from '../../docker/buildImages';
import { mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
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
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
