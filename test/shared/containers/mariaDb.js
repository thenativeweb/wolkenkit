'use strict';

const buntstift = require('buntstift'),
      mysql = require('mysql2/promise'),
      oneLine = require('common-tags/lib/oneLine'),
      retry = require('async-retry'),
      shell = require('shelljs');

const getConnectionOptions = require('./getConnectionOptions'),
      getRetryOptions = require('./getRetryOptions');

const mariaDb = {
  async start () {
    const connectionOptions = getConnectionOptions();

    const {
      hostname,
      port,
      username,
      password,
      database
    } = connectionOptions.mariaDb;

    shell.exec(oneLine`
      docker run
        -d
        -p ${port}:3306
        -e MYSQL_ROOT_PASSWORD=${password}
        -e MYSQL_USER=${username}
        -e MYSQL_PASSWORD=${password}
        -e MYSQL_DATABASE=${database}
        --name test-mariadb
        thenativeweb/wolkenkit-mariadb:latest
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
      await retry(async () => {
        const connection = await pool.getConnection();

        await connection.release();
      }, getRetryOptions());
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to MariaDB.');
      throw ex;
    }

    await pool.end();
  },

  async stop () {
    shell.exec([
      'docker kill test-mariadb',
      'docker rm -v test-mariadb'
    ].join(';'));
  }
};

module.exports = mariaDb;
