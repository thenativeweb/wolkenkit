'use strict';

const connectionStrings = {
  mariadb: {
    integrationTests: 'mariadb://wolkenkit:wolkenkit@local.wolkenkit.io:3306/wolkenkit'
  },
  mongodb: {
    integrationTests: 'mongodb://wolkenkit:wolkenkit@local.wolkenkit.io:27017/wolkenkit'
  },
  mysql: {
    integrationTests: 'mysql://wolkenkit:wolkenkit@local.wolkenkit.io:3307/wolkenkit'
  },
  postgres: {
    integrationTests: 'pg://wolkenkit:wolkenkit@local.wolkenkit.io:5432/wolkenkit'
  },
  sqlServer: {
    integrationTests: 'mssql://SA:Wolkenkit123@local.wolkenkit.io:1433/wolkenkit'
  }
};

module.exports = connectionStrings;
