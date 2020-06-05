import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { ConnectionPool } from 'mssql';
import { oneLine } from 'common-tags';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';

const createDatabase = async function ({ pool, database }: {
  pool: ConnectionPool;
  database: string;
}): Promise<void> {
  await pool.query(`
    IF NOT EXISTS(SELECT * from sys.databases WHERE name = '${database}')
      BEGIN
        CREATE DATABASE ${database};
      END;
  `);
};

const sqlServer = {
  async start (): Promise<void> {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.sqlServer;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:1433
        -e ACCEPT_EULA=Y
        -e SA_PASSWORD=${password}
        --name test-sqlserver
        thenativeweb/wolkenkit-sqlserver:latest
    `);

    try {
      await retry(async (): Promise<void> => {
        const pool = new ConnectionPool({
          server: hostName,
          port,
          user: userName,
          password,
          database: 'master',
          options: {
            enableArithAbort: true,
            encrypt: false,
            trustServerCertificate: false
          }
        });

        await pool.connect();
        await createDatabase({ pool, database });
        await pool.close();
      }, retryOptions);
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to SQL Server.');
      throw ex;
    }
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-sqlserver',
      'docker rm -v test-sqlserver'
    ].join(';'));
  }
};

export { sqlServer };
