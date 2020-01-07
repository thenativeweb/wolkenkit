import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { oneLine } from 'common-tags';
import { Pool } from 'pg';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';

const postgres = {
  async start (): Promise<void> {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.postgres;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:5432
        -e POSTGRES_DB=${database}
        -e POSTGRES_USER=${userName}
        -e POSTGRES_PASSWORD=${password}
        --name test-postgres
        thenativeweb/wolkenkit-postgres:latest
    `);

    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database
    });

    try {
      await retry(async (): Promise<void> => {
        const connection = await pool.connect();

        connection.release();
      }, retryOptions);
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to Postgres.');
      throw ex;
    }

    await pool.end();
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-postgres',
      'docker rm -v test-postgres'
    ].join(';'));
  }
};

export { postgres };
