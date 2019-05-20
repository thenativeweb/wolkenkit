'use strict';

const { Connection, Request } = require('tedious'),
      oneLine = require('common-tags/lib/oneLine'),
      retry = require('async-retry'),
      shell = require('shelljs');

const getConnectionOptions = require('./getConnectionOptions');

const createDatabase = async function ({ connection, database }) {
  if (!connection) {
    throw new Error('Connection is missing.');
  }
  if (!database) {
    throw new Error('Database is missing.');
  }

  const createDatabaseQuery = `
    IF NOT EXISTS(SELECT * from sys.databases WHERE name='${database}')
      BEGIN
        CREATE DATABASE ${database};
      END`;

  await new Promise((resolve, reject) => {
    const createDatabaseRequest = new Request(createDatabaseQuery, err => {
      if (err) {
        return reject(err);
      }

      resolve();
    });

    connection.execSql(createDatabaseRequest);
  });
};

const sqlServer = {
  async start () {
    const connectionOptions = getConnectionOptions();

    const {
      hostname,
      port,
      username,
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
        microsoft/mssql-server-linux:2017-CU6
    `);

    const configuration = {
      server: hostname,
      options: { port, encrypt: false },
      userName: username,
      password,
      database: 'master'
    };

    let connection;

    await retry(async () => {
      await new Promise((resolve, reject) => {
        connection = new Connection(configuration);

        const removeListeners = () => {
          connection.removeAllListeners('connect');
          connection.removeAllListeners('end');
        };

        const handleConnect = err => {
          removeListeners();

          if (err) {
            return reject(err);
          }

          resolve();
        };

        const handleEnd = () => {
          removeListeners();

          reject(new Error('Could not connect.'));
        };

        connection.on('connect', handleConnect);
        connection.on('end', handleEnd);
      });
    });

    await createDatabase({ connection, database });

    await new Promise(resolve => {
      connection.once('end', resolve);

      connection.close();
    });
  },

  async stop () {
    shell.exec([
      'docker kill test-sqlserver',
      'docker rm -v test-sqlserver'
    ].join(';'));
  }
};

module.exports = sqlServer;
