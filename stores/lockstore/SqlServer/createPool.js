'use strict';

const { Connection } = require('tedious'),
      noop = require('lodash/noop'),
      { Pool } = require('tarn');

const createPool = function ({
  host,
  port,
  user,
  password,
  database,
  encrypt,
  onError = noop,
  onDisconnect = noop
}) {
  if (!host) {
    throw new Error('Host is missing.');
  }
  if (!port) {
    throw new Error('Port is missing.');
  }
  if (!user) {
    throw new Error('User is missing.');
  }
  if (!password) {
    throw new Error('Password is missing.');
  }
  if (!database) {
    throw new Error('Database is missing.');
  }
  if (encrypt === undefined) {
    throw new Error('Encrypt is missing.');
  }

  const pool = new Pool({
    min: 2,
    max: 10,
    acquireTimeoutMillis: 1000,
    createTimeoutMillis: 1000,
    idleTimeoutMillis: 1000,
    propagateCreateError: true,

    validate (connection) {
      return !connection.closed;
    },

    create () {
      return new Promise((resolve, reject) => {
        const connection = new Connection({
          server: host,
          options: { port, database, encrypt },
          authentication: {
            type: 'default',
            options: { userName: user, password }
          }
        });

        let handleConnect,
            handleEnd,
            handleError,
            hasBeenConnected = false;

        const unsubscribe = () => {
          connection.removeListener('connect', handleConnect);
          connection.removeListener('error', handleError);
          connection.removeListener('end', handleEnd);
        };

        const unsubscribeSetup = () => {
          connection.removeListener('connect', handleConnect);
        };

        handleConnect = err => {
          if (err) {
            unsubscribe();

            return reject(err);
          }

          hasBeenConnected = true;
          unsubscribeSetup();
          resolve(connection);
        };

        handleError = err => {
          unsubscribe();

          onError(err);
        };

        handleEnd = () => {
          unsubscribe();

          if (!hasBeenConnected) {
            return reject(new Error('Could not connect to database.'));
          }

          onDisconnect();
        };

        connection.on('connect', handleConnect);
        connection.on('error', handleError);
        connection.on('end', handleEnd);
      });
    },

    destroy (connection) {
      if (connection.closed) {
        return;
      }

      connection.removeAllListeners('end');
      connection.removeAllListeners('error');

      connection.close();
    }
  });

  return pool;
};

module.exports = createPool;
