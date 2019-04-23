'use strict';

const connectionStrings = {
  mariadb: {
    unitTests: 'mariadb://wolkenkit:wolkenkit@local.wolkenkit.io:3306/wolkenkit'
  },
  mongodb: {
    unitTests: 'mongodb://wolkenkit:wolkenkit@local.wolkenkit.io:27017/wolkenkit'
  },
  mysql: {
    unitTests: 'mysql://wolkenkit:wolkenkit@local.wolkenkit.io:3307/wolkenkit'
  },
  postgres: {
    unitTests: 'pg://wolkenkit:wolkenkit@local.wolkenkit.io:5432/wolkenkit'
  },
  sqlServer: {
    unitTests: 'mssql://SA:Wolkenkit123@local.wolkenkit.io:1433/wolkenkit'
  }
};

module.exports = connectionStrings;
