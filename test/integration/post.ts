import containers from '../shared/containers';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  await Promise.all([
    containers.mariaDb.stop(),
    containers.minio.stop(),
    containers.mongoDb.stop(),
    containers.mySql.stop(),
    containers.postgres.stop(),
    containers.redis.stop(),
    containers.sqlServer.stop()
  ]);
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
