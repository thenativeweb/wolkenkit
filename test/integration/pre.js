'use strict';

const oneLine = require('common-tags/lib/oneLine'),
      shell = require('shelljs');

const connectionStrings = require('../shared/connectionStrings'),
      waitFor = require('../shared/waitFor');

const pre = async function () {
  shell.exec(oneLine`
    docker run
      -d
      -p 3306:3306
      -e MYSQL_ROOT_PASSWORD=wolkenkit
      -e MYSQL_USER=wolkenkit
      -e MYSQL_PASSWORD=wolkenkit
      -e MYSQL_DATABASE=wolkenkit
      --name mariadb-integration
      mariadb:10.3.5
      --bind-address=0.0.0.0
  `);
  shell.exec(oneLine`
    docker run
      -d
      -p 27017:27017
      -e MONGODB_DATABASE=wolkenkit
      -e MONGODB_USER=wolkenkit
      -e MONGODB_PASS=wolkenkit
      --name mongodb-integration
      thenativeweb/wolkenkit-mongodb:latest
  `);
  shell.exec(oneLine`
    docker run
      -d
      -p 3307:3306
      -e MYSQL_ROOT_PASSWORD=wolkenkit
      -e MYSQL_USER=wolkenkit
      -e MYSQL_PASSWORD=wolkenkit
      -e MYSQL_DATABASE=wolkenkit
      --name mysql-integration
      mysql:5.7.21
      --bind-address=0.0.0.0
  `);
  shell.exec(oneLine`
    docker run
      -d
      -p 5432:5432
      -e POSTGRES_DB=wolkenkit
      -e POSTGRES_USER=wolkenkit
      -e POSTGRES_PASSWORD=wolkenkit
      --name postgres-integration
      thenativeweb/wolkenkit-postgres:latest
  `);
  shell.exec(oneLine`
    docker run
      -d
      -p 1433:1433
      -e ACCEPT_EULA=Y
      -e SA_PASSWORD=Wolkenkit123
      --name sqlserver-integration
      microsoft/mssql-server-linux:2017-CU6
  `);

  await waitFor.mariadb({ url: connectionStrings.mariadb.integrationTests });
  await waitFor.mongodb({ url: connectionStrings.mongodb.integrationTests });
  await waitFor.mysql({ url: connectionStrings.mysql.integrationTests });
  await waitFor.postgres({ url: connectionStrings.postgres.integrationTests });
  await waitFor.sqlServer({ url: connectionStrings.sqlServer.integrationTests });
};

module.exports = pre;
