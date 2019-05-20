'use strict';

const oneLine = require('common-tags/lib/oneLine'),
      pg = require('pg'),
      retry = require('async-retry'),
      shell = require('shelljs');

const getConnectionOptions = require('./getConnectionOptions');

const postgres = {
  async start () {
    const connectionOptions = getConnectionOptions();

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

    await retry(async () => {
      const connection = await pool.connect();

      connection.release();
    });

    await pool.end();
  },

  async stop () {
    shell.exec([
      'docker kill test-postgres',
      'docker rm -v test-postgres'
    ].join(';'));
  }
};

module.exports = postgres;
