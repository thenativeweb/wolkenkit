'use strict';

const getConnectionOptions = function () {
  const connectionOptions = {
    consul: {
      hostname: 'localhost',
      portApi: 8500,
      portDns: 8600,
      encryptConnection: false,
      externalDns: '8.8.8.8'
    },
    mariaDb: {
      hostname: 'localhost',
      port: 3306,
      username: 'wolkenkit',
      password: 'wolkenkit',
      database: 'wolkenkit'
    },
    minio: {
      hostname: 'localhost',
      port: 9000,
      accessKey: 'wolkenkit',
      secretKey: 'wolkenkit',
      encryptConnection: false
    },
    mongoDb: {
      hostname: 'localhost',
      port: 27017,
      username: 'wolkenkit',
      password: 'wolkenkit',
      database: 'wolkenkit'
    },
    mySql: {
      hostname: 'localhost',
      port: 3307,
      username: 'wolkenkit',
      password: 'wolkenkit',
      database: 'wolkenkit'
    },
    postgres: {
      hostname: 'localhost',
      port: 5432,
      username: 'wolkenkit',
      password: 'wolkenkit',
      database: 'wolkenkit'
    },
    rabbitMq: {
      hostname: 'localhost',
      port: 5672,
      username: 'wolkenkit',
      password: 'wolkenkit'
    },
    redis: {
      hostname: 'localhost',
      port: 6379,
      password: 'wolkenkit',
      database: '0'
    },
    sqlServer: {
      hostname: 'localhost',
      port: 1433,
      username: 'SA',
      password: 'Wolkenkit123',
      database: 'wolkenkit'
    }
  };

  return connectionOptions;
};

module.exports = getConnectionOptions;
