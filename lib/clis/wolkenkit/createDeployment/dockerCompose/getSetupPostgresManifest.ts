import { minio } from './constants/minio';
import { postgres } from './constants/postgres';
import { versions } from '../../../../versions';

const getSetupPostgresManifest = function (): string {
  const services = {
    postgres,
    minio
  };

  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      setup:
        build: '../../'
          command: >
            sh -c "
              node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store consumer-progress postgres --host-name ${services.postgres.hostName} --port ${services.postgres.privatePort} --user-name ${services.postgres.userName} --password ${services.postgres.password} --database ${services.postgres.database} --table-name-progress progress-flow &&
              node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store domain-event postgres --host-name ${services.postgres.hostName} --port ${services.postgres.privatePort} --user-name ${services.postgres.userName} --password ${services.postgres.password} --database ${services.postgres.database} --table-name-domain-events domainEvents --table-name-snapshots snapshots &&
              node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store file s3 --host-name ${services.minio.hostName} --port ${services.minio.privatePort} --access-key ${services.minio.accessKey} --secret-key ${services.minio.secretKey} --bucket-name ${services.minio.bucketName} &&
              node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store lock postgres --host-name ${services.postgres.hostName} --port ${services.postgres.privatePort} --user-name ${services.postgres.userName} --password ${services.postgres.password} --database ${services.postgres.database} --table-name-locks locks &&
              node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store priority-queue postgres --host-name ${services.postgres.hostName} --port ${services.postgres.privatePort} --user-name ${services.postgres.userName} --password ${services.postgres.password} --database ${services.postgres.database} --table-name-items items-command --table-name-priority-queue priorityQueue-command &&
              node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store priority-queue postgres --host-name ${services.postgres.hostName} --port ${services.postgres.privatePort} --user-name ${services.postgres.userName} --password ${services.postgres.password} --database ${services.postgres.database} --table-name-items items-domain-event --table-name-priority-queue priorityQueue-domain-event &&
              node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup infrastructure
            "
          init: true
  `;
};

export { getSetupPostgresManifest };
