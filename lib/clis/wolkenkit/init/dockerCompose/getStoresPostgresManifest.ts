import { minio } from './constants/minio';
import { postgres } from './constants/postgres';
import { versions } from '../../../../versions';

const getStoresPostgresManifest = function (): string {
  const services = {
    postgres,
    minio
  };

  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      ${services.postgres.hostName}:
        image: 'postgres:${versions.dockerImages.postgres}'
        environment:
          POSTGRES_DB: '${services.postgres.database}'
          POSTGRES_USER: '${services.postgres.userName}'
          POSTGRES_PASSWORD: '${services.postgres.password}'
          PGDATA: '/var/lib/postgresql/data'
        restart: 'always'
        volumes:
          - 'postgres:/var/lib/postgresql/data'

      ${services.minio.hostName}:
        image: 'minio/minio:${versions.dockerImages.minio}'
        command: 'server /data'
        environment:
          MINIO_ACCESS_KEY: '${services.minio.accessKey}'
          MINIO_SECRET_KEY: '${services.minio.secretKey}'
        restart: 'always'
        volumes:
          - 'minio:/data'

    volumes:
      postgres:
      minio:
  `;
};

export { getStoresPostgresManifest };
