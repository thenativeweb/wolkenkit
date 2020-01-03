import { buntstift } from 'buntstift';
import { connectionOptions } from './connectionOptions';
import { oneLine } from 'common-tags';
import { retry } from 'retry-ignore-abort';
import { retryOptions } from './retryOptions';
import shell from 'shelljs';
import { createPool, MysqlError, PoolConnection } from 'mysql';

const mariaDb = {
  async start (): Promise<void> {
    const {
      hostName,
      port,
      userName,
      password,
      database
    } = connectionOptions.mariaDb;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:3306
        -e MYSQL_ROOT_PASSWORD=${password}
        -e MYSQL_USER=${userName}
        -e MYSQL_PASSWORD=${password}
        -e MYSQL_DATABASE=${database}
        --name test-mariadb
        thenativeweb/wolkenkit-mariadb:latest
        --bind-address=0.0.0.0
    `);

    const pool = createPool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      connectTimeout: 0
    });

    try {
      await retry(async (): Promise<void> => {
        const connection: PoolConnection = await new Promise((resolve, reject): void => {
          pool.getConnection((err: MysqlError | null, poolConnection): void => {
            if (err) {
              reject(err);

              return;
            }
            resolve(poolConnection);
          });
        });

        connection.release();
      }, retryOptions);
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to MariaDB.');
      throw ex;
    }

    await new Promise((resolve): void => {
      pool.end(resolve);
    });
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-mariadb',
      'docker rm -v test-mariadb'
    ].join(';'));
  }
};

export { mariaDb };
