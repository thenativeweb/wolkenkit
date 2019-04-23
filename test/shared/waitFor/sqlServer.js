'use strict';

const { Connection, Request } = require('tedious'),
      DsnParser = require('dsn-parser'),
      retry = require('async-retry');

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

const waitForSqlServer = async function ({ url }) {
  if (!url) {
    throw new Error('Url is missing.');
  }

  const { host, port, user, password, database } = new DsnParser(url).getParts();

  const config = {
    server: host,
    options: { port, encrypt: false },
    userName: user,
    password,
    database: 'master'
  };

  let connection;

  await retry(async () => {
    await new Promise((resolve, reject) => {
      connection = new Connection(config);

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
};

module.exports = waitForSqlServer;
