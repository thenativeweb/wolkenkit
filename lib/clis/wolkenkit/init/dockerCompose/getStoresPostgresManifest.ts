import { services } from './services';
import { versions } from '../../../../versions';

const getStoresPostgresManifest = function (): string {
  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      ${services.stores.postgres.hostName}:
        image: 'postgres:${versions.dockerImages.postgres}'
        environment:
          POSTGRES_DB: '${services.stores.postgres.database}'
          POSTGRES_USER: '${services.stores.postgres.userName}'
          POSTGRES_PASSWORD: '${services.stores.postgres.password}'
          PGDATA: '/var/lib/postgresql/data'
        restart: 'always'
        volumes:
          - 'postgres:/var/lib/postgresql/data'

      ${services.stores.minio.hostName}:
        image: 'minio/minio:${versions.dockerImages.minio}'
        command: 'server /data'
        environment:
          MINIO_ACCESS_KEY: '${services.stores.minio.accessKey}'
          MINIO_SECRET_KEY: '${services.stores.minio.secretKey}'
        restart: 'always'
        volumes:
          - 'minio:/data'

    volumes:
      postgres:
      minio:
  `;
};

export { getStoresPostgresManifest };
