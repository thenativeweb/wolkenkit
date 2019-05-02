'use strict';

const getConnectionOptions = function ({ type }) {
  if (!type) {
    throw new Error('Type is missing.');
  }

  const connectionOptions = {
    integration: {
      mariaDb: {
        url: 'mariadb://wolkenkit:wolkenkit@localhost:3306/wolkenkit'
      },
      minio: {
        endpoint: 'localhost',
        port: 9000,
        useSsl: false,
        accessKey: 'wolkenkit',
        secretKey: 'wolkenkit'
      },
      mongoDb: {
        url: 'mongodb://wolkenkit:wolkenkit@localhost:27017/wolkenkit'
      },
      mySql: {
        url: 'mysql://wolkenkit:wolkenkit@localhost:3307/wolkenkit'
      },
      postgres: {
        url: 'pg://wolkenkit:wolkenkit@localhost:5432/wolkenkit'
      },
      rabbitMq: {
        url: 'amqp://wolkenkit:wolkenkit@localhost:5672'
      },
      sqlServer: {
        url: 'mssql://SA:Wolkenkit123@localhost:1433/wolkenkit'
      }
    }
  };

  if (!connectionOptions[type]) {
    throw new Error(`Invalid type '${type}'.`);
  }

  return connectionOptions[type];
};

module.exports = getConnectionOptions;
