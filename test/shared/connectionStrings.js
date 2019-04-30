'use strict';

const connectionStrings = {
  mariaDb: {
    integrationTests: 'mariadb://wolkenkit:wolkenkit@localhost:3306/wolkenkit'
  },
  mongoDb: {
    integrationTests: 'mongodb://wolkenkit:wolkenkit@localhost:27017/wolkenkit'
  },
  mySql: {
    integrationTests: 'mysql://wolkenkit:wolkenkit@localhost:3307/wolkenkit'
  },
  postgres: {
    integrationTests: 'pg://wolkenkit:wolkenkit@localhost:5432/wolkenkit'
  },
  rabbitMq: {
    integrationTests: 'amqp://wolkenkit:wolkenkit@localhost:5672'
  },
  sqlServer: {
    integrationTests: 'mssql://SA:Wolkenkit123@localhost:1433/wolkenkit'
  }
};

module.exports = connectionStrings;
