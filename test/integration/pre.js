'use strict';

const oneLine = require('common-tags/lib/oneLine'),
      shell = require('shelljs');

const getConnectionOptions = require('../shared/getConnectionOptions'),
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
      -p 9000:9000
      -e "MINIO_ACCESS_KEY=wolkenkit"
      -e "MINIO_SECRET_KEY=wolkenkit"
      --name minio-integration
      minio/minio:latest
      server
      /data
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
      -p 5672:5672
      -e RABBITMQ_DEFAULT_USER=wolkenkit
      -e RABBITMQ_DEFAULT_PASS=wolkenkit
      --name rabbitmq-integration
      thenativeweb/wolkenkit-rabbitmq:latest
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

  const connectionOptions = getConnectionOptions({ type: 'integration' });

  await waitFor.mariaDb(connectionOptions.mariaDb);
  await waitFor.minio(connectionOptions.minio);
  await waitFor.mongoDb(connectionOptions.mongoDb);
  await waitFor.mySql(connectionOptions.mySql);
  await waitFor.postgres(connectionOptions.postgres);
  await waitFor.rabbitMq(connectionOptions.rabbitMq);
  await waitFor.sqlServer(connectionOptions.sqlServer);
};

module.exports = pre;
