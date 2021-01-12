import { services } from './services';
import { versions } from '../../../../versions';

const getSetupPostgresManifest = function (): string {
  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      setup:
        build: '../../'
        command: >
          sh -c "
            node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store consumer-progress postgres --host-name ${services.stores.postgres.hostName} --port ${services.stores.postgres.privatePort} --user-name ${services.stores.postgres.userName} --password ${services.stores.postgres.password} --database ${services.stores.postgres.database} --table-name-progress progress-flow &&
            node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store domain-event postgres --host-name ${services.stores.postgres.hostName} --port ${services.stores.postgres.privatePort} --user-name ${services.stores.postgres.userName} --password ${services.stores.postgres.password} --database ${services.stores.postgres.database} --table-name-domain-events domainEvents --table-name-snapshots snapshots &&
            node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store file s3 --host-name ${services.stores.minio.hostName} --port ${services.stores.minio.privatePort} --access-key ${services.stores.minio.accessKey} --secret-key ${services.stores.minio.secretKey} --bucket-name ${services.stores.minio.bucketName} &&
            node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store lock postgres --host-name ${services.stores.postgres.hostName} --port ${services.stores.postgres.privatePort} --user-name ${services.stores.postgres.userName} --password ${services.stores.postgres.password} --database ${services.stores.postgres.database} --table-name-locks locks &&
            node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store priority-queue postgres --host-name ${services.stores.postgres.hostName} --port ${services.stores.postgres.privatePort} --user-name ${services.stores.postgres.userName} --password ${services.stores.postgres.password} --database ${services.stores.postgres.database} --table-name-items items-command --table-name-priority-queue priorityQueue-command &&
            node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup store priority-queue postgres --host-name ${services.stores.postgres.hostName} --port ${services.stores.postgres.privatePort} --user-name ${services.stores.postgres.userName} --password ${services.stores.postgres.password} --database ${services.stores.postgres.database} --table-name-items items-domain-event --table-name-priority-queue priorityQueue-domain-event &&
            node ./node_modules/wolkenkit/build/lib/bin/wolkenkit.js setup infrastructure
          "
        init: true
  `;
};

export { getSetupPostgresManifest };
