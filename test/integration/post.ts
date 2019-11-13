import { mariaDb, minio, mongoDb, mySql, postgres, redis, sqlServer } from '../shared/containers';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  await Promise.all([
    mariaDb.stop(),
    minio.stop(),
    mongoDb.stop(),
    mySql.stop(),
    postgres.stop(),
    redis.stop(),
    sqlServer.stop()
  ]);
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
