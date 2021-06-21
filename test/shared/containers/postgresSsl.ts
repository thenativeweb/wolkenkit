import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { oneLine } from 'common-tags';
import { Pool } from 'pg';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';

const postgresSsl = {
  async start (): Promise<void> {
    const {
      hostName,
      port,
      userName,
      password,
      database,
      encryptConnection
    } = connectionOptions.postgresSsl;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:5432
        -e POSTGRES_DB=${database}
        -e POSTGRES_USER=${userName}
        -e POSTGRES_PASSWORD=${password}
        --name test-postgres-ssl
        thenativeweb/wolkenkit-postgres-ssl:latest
        -c ssl=on
        -c ssl_cert_file=/app/server.crt
        -c ssl_key_file=/app/server.key
    `);

    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      ssl: encryptConnection
    });

    try {
      await retry(async (): Promise<void> => {
        const connection = await pool.connect();

        connection.release();
      }, retryOptions);
    } catch (ex: unknown) {
      buntstift.info((ex as Error).message);
      buntstift.error('Failed to connect to Postgres.');
      throw ex;
    }

    await pool.end();
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-postgres-ssl',
      'docker rm -v test-postgres-ssl'
    ].join(';'));
  }
};

export { postgresSsl };
