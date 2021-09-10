import fs from 'fs';
import path from 'path';

const connectionOptions = {
  azurite: {
    hostName: 'localhost',
    port: 10_000,
    accountName: 'devstoreaccount1',
    accountKey: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
    containerName: 'wolkenkit'
  },
  mariaDb: {
    hostName: 'localhost',
    port: 3_307,
    userName: 'wolkenkit',
    password: 'wolkenkit',
    database: 'wolkenkit'
  },
  minio: {
    hostName: 'localhost',
    port: 9_000,
    accessKey: 'wolkenkit',
    secretKey: 'wolkenkit',
    encryptConnection: false
  },
  mongoDb: {
    connectionString: 'mongodb://wolkenkit:wolkenkit@localhost:27017/wolkenkit'
  },
  mySql: {
    hostName: 'localhost',
    port: 3_308,
    userName: 'wolkenkit',
    password: 'wolkenkit',
    database: 'wolkenkit'
  },
  postgres: {
    hostName: 'localhost',
    port: 5_432,
    userName: 'wolkenkit',
    password: 'wolkenkit',
    database: 'wolkenkit'
  },
  postgresSsl: {
    hostName: 'localhost',
    port: 5_433,
    userName: 'wolkenkit',
    password: 'wolkenkit',
    database: 'wolkenkit',
    encryptConnection: {
      /* eslint-disable no-sync */
      privateKey: fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docker', 'wolkenkit-postgres-ssl', 'privateKey.pem'), 'utf-8'),
      certificate: fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docker', 'wolkenkit-postgres-ssl', 'certificate.pem'), 'utf-8'),
      /* eslint-enable no-sync */
      rejectUnauthorized: false
    }
  },
  redis: {
    hostName: 'localhost',
    port: 6_379,
    password: 'wolkenkit',
    database: 0
  },
  sqlServer: {
    hostName: 'localhost',
    port: 1_433,
    userName: 'SA',
    password: 'Wolkenkit123',
    database: 'wolkenkit'
  }
};

export { connectionOptions };
