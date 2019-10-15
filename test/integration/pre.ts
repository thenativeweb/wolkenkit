import buildImages from '../../docker/buildImages';
import containers from '../shared/containers';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  await buildImages();

  await Promise.all([
    containers.mariaDb.start(),
    containers.minio.start(),
    containers.mongoDb.start(),
    containers.mySql.start(),
    containers.postgres.start(),
    containers.redis.start(),
    containers.sqlServer.start()
  ]);
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
