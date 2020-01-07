import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { oneLine } from 'common-tags';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';
import { Connection, Request } from 'tedious';

const createDatabase = async function ({ connection, database }: {
  connection: Connection;
  database: string;
}): Promise<void> {
  const createDatabaseQuery = `
    IF NOT EXISTS(SELECT * from sys.databases WHERE name='${database}')
      BEGIN
        CREATE DATABASE ${database};
      END`;

  await new Promise((resolve: (value?: void) => void, reject: (reason?: any) => void): any => {
    const createDatabaseRequest = new Request(createDatabaseQuery, (err?: Error): void => {
      if (err) {
        return reject(err);
      }

      resolve();
    });

    connection.execSql(createDatabaseRequest);
  });
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

    const configuration = {
      server: hostName,
      options: { port, database: 'master', encrypt: false },
      authentication: {
        type: 'default',
        options: { userName, password }
      }
    };

    let connection: Connection;

    try {
      await retry(async (): Promise<void> => {
        await new Promise((resolve: (value?: void) => void, reject: (reason?: any) => void): any => {
          connection = new Connection(configuration);

          const removeListeners = (): void => {
            connection.removeAllListeners('connect');
            connection.removeAllListeners('error');
            connection.removeAllListeners('end');
          };

          const handleConnect = (err?: Error): void => {
            removeListeners();

            if (err) {
              return reject(err);
            }

            resolve();
          };

          const handleError = (err?: Error): void => {
            removeListeners();

            reject(err);
          };

          const handleEnd = (): void => {
            removeListeners();

            reject(new Error('Could not connect.'));
          };

          connection.on('connect', handleConnect);
          connection.on('error', handleError);
          connection.on('end', handleEnd);
        });

        await createDatabase({ connection, database });

        await new Promise((resolve: (value?: void) => void): any => {
          connection.once('end', resolve);

          connection.close();
        });
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
