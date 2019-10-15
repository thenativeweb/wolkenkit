import buntstift from 'buntstift';
import connectionOptions from './connectionOptions';
import { oneLine } from 'common-tags';
import pg from 'pg';
import retry from 'async-retry';
import retryOptions from './retryOptions';
import shell from 'shelljs';

const postgres = {
  async start (): Promise<void> {
    const {
      hostname,
      port,
      username,
      password,
      database
    } = connectionOptions.postgres;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:5432
        -e POSTGRES_DB=${database}
        -e POSTGRES_USER=${username}
        -e POSTGRES_PASSWORD=${password}
        --name test-postgres
        thenativeweb/wolkenkit-postgres:latest
    `);

    const pool = new pg.Pool({
      host: hostname,
      port,
      user: username,
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

export default postgres;
