import buntstift from 'buntstift';
import connectionOptions from './connectionOptions';
import mysql from 'mysql2/promise';
import { oneLine } from 'common-tags';
import retry from 'async-retry';
import retryOptions from './retryOptions';
import shell from 'shelljs';

const mySql = {
  async start (): Promise<void> {
    const {
      hostname,
      port,
      username,
      password,
      database
    } = connectionOptions.mySql;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:3306
        -e MYSQL_ROOT_PASSWORD=${password}
        -e MYSQL_USER=${username}
        -e MYSQL_PASSWORD=${password}
        -e MYSQL_DATABASE=${database}
        --name test-mysql
        thenativeweb/wolkenkit-mysql:latest
        --bind-address=0.0.0.0
    `);

    const pool = mysql.createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      connectTimeout: 0
    });

    try {
      await retry(async (): Promise<void> => {
        const connection = await pool.getConnection();

        await connection.release();
      }, retryOptions);
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to MySQL.');
      throw ex;
    }

    await pool.end();
  },

  async stop (): Promise<void> {
    shell.exec([
      'docker kill test-mysql',
      'docker rm -v test-mysql'
    ].join(';'));
  }
};

export default mySql;
